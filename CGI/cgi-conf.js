"use strict";
/**
* Get the arguments and/or configuration file for a CGI environment
*/
const _					= require('underscore');
const moment			= require('moment');
const fs				= require('fs');
const path				= require('path');
const conf_tools		= require('../lib/conf');
const user_config_name 	= ".scribejs.json";

const JEKYLL_NONE		= "none";
const JEKYLL_MARKDOWN	= "md";
const JEKYLL_KRAMDOWN	= "kd";

let default_config = {
	date           : moment(),
	final		   : false,
	torepo         : false,
	jekyll		   : JEKYLL_NONE,
	nick_mappings  : {}
}

/**
 * Collect the full configuration information. This is a combination of four possible sources
 * of increasing priority
 * - default configuration (contains empty fields except for the date which set to 'today')
 * - user configuration, ie, ~/.scribejs.json
 * - configuration file provided CGI call (forwarded in the argument)
 *
 * @returns {object} - full configuration. See the overal manual for the field definitions
 */
exports.get_config = (cgi_config, script_name) => {
	/***********************************************************************/
	// See if there is user level config file
	let local_config = conf_tools.json_conf_file(path.join(path.dirname(script_name), user_config_name), false);

	/***********************************************************************/
	// Combine the configuration in increasing priority order
	let retval = _.extend(default_config, cgi_config, local_config);

	/***********************************************************************/
	// Fifths step: sanity check and some cleanup on the configuration object

	// 1. If the group is provided and no explicit input, we should retreive the
	// IRC log from the W3C site
	// Note, however, if the group is set the IRC URL is to be set in any case,
	// because that is the original one stored on the Web site,
	// ie, that must be referred to in the header of the minutes
	if(retval.group) {
		// Set the default IRC URL
		retval.orig_irc_log = conf_tools.set_input_url(retval.date, retval.group);
		if(!retval.irclog) {
			retval.input = retval.orig_irc_log
		}
	}

	// 2. get read of the 'moment' object and use ISO date instead
	retval.date = retval.date.format("YYYY-MM-DD");

	// 3. if the input is not set, nothing should happen!
	if(!retval.input && !retval.irclog) {
		// There is nothing to do!!
		throw new Error("no irc log is provided; either it should be uploaded or a date should be provided!");
	}

	// 4. if the github repo should be used, some values are required. If they are
	// present, the output file name for the repo can be generated, if needed
	// The name may be used even if the github storage is not in effect (as a return parameter in the header)...
	retval.ghfname   = retval.output ? retval.output : `${retval.date}-minutes.md`
	if(retval.torepo) {
		let needed = [retval.ghname, retval.ghemail, retval.ghtoken, retval.ghrepo, retval.ghpath]
		if(_.every(needed, (val) => !_.isUndefined(val))) {
			retval.ghmessage = `Added minutes for ${retval.date} at ${moment().format("YYYY-MM-DD H:m:s Z")}`
		} else {
			let message = "repository output is required, but not all values are provided.\n"
			let message2 = "are needed: ghname, ghemail, ghtoken, ghrepo, ghpath\n"
			if(retval.ghtoken !== undefined) retval.ghtoken = "(hidden)";
			if(retval.ghemail !== undefined) retval.ghemail = "(hidden)";
			if(retval.ghname !== undefined)  retval.ghname  = "(hidden)";
			throw new Error(message + message2 + JSON.stringify(retval, null, 2));
		}
	}

	return retval
}
