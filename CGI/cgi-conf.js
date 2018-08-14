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
 * @param {Function} cb - callback, with the signature (err, data)
 *                        where 'data' is full configuration;
 *                        see the overal manual for the field definitions
 */
exports.get_config = (cgi_config, script_name, cb) => {
	conf_tools.json_conf_file(path.join(path.dirname(script_name), user_config_name), false, (err, local_config) => {
        if(err)
            cb(err);
        else {
        	let retval = _.extend(default_config, cgi_config, local_config);
        	if(retval.group) {
        		retval.orig_irc_log = conf_tools.set_input_url(retval.date, retval.group);
        		if(!retval.irclog)
        			retval.input = retval.orig_irc_log
        	}
        	retval.date = retval.date.format("YYYY-MM-DD");
        	if(!retval.input && !retval.irclog)
        		throw new Error("no irc log is provided; either it should be uploaded or a date should be provided!");
        	retval.ghfname   = retval.output ? retval.output : `${retval.date}-minutes.md`
        	if(retval.torepo) {
        		let needed = [retval.ghname, retval.ghemail, retval.ghtoken, retval.ghrepo, retval.ghpath]
        		if(_.every(needed, (val) => !_.isUndefined(val)))
        			retval.ghmessage = `Added minutes for ${retval.date} at ${moment().format("YYYY-MM-DD H:m:s Z")}`
        		else {
        			let message = "repository output is required, but not all values are provided.\n"
        			let message2 = "are needed: ghname, ghemail, ghtoken, ghrepo, ghpath\n"
        			if(retval.ghtoken !== undefined) retval.ghtoken = "(hidden)";
        			if(retval.ghemail !== undefined) retval.ghemail = "(hidden)";
        			if(retval.ghname !== undefined)  retval.ghname  = "(hidden)";
        			throw new Error(message + message2 + JSON.stringify(retval, null, 2));
        		}
        	}
        	cb(null, retval);
        }
    });
};
