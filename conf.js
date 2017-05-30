/**
* Get the arguments and/or configuration file
*/
const _       = require('underscore');
const moment  = require('moment');
const fs      = require('fs');
const path    = require('path');
const program = require('commander');
const user_config_name = ".scribejs.json"

let default_config = {
	date           : moment(),
	torepo         : false,
	jekyll		   : false,
	nick_mappings  : {}
}

/**
* Read a configuration file
*
* @param {string} fname - file name
* @param {boolean} warn - whether an error warning should be sent to the standard error if there are issues
* @returns {object} - the parsed JSON content
*/
exports.json_conf_file = (fname, warn) => {
	let file_c = null;
	try {
		file_c = fs.readFileSync(fname, "utf-8")
	} catch(e) {
		if(warn) console.error(`Warning: no such file: ${fname}!\n`)
		return {};
	}
	try {
		// Date values are converted into moments on the fly
		return JSON.parse(file_c, (key,value) => (key === "date" ? moment(value) : value));
	} catch(e) {
		console.error(e);
		return {};
	}
};

/**
 * Return the URL to the input: the RSS IRC script URL on the HTTP Date space, namely
 *  https://www.w3.org/{year}/{month}/{day}-{wg}-irc.txt. The all date values are zero padded.
 *
 * @param {moment} date
 * @param {string} wg - the name of the wg/ig used when RRSAgent generates the IRC log
 */
exports.set_input_url = (date, wg) => {
	let zeropadding = (n) => (n < 10 ? "0" + n : "" + n);
	let month = zeropadding(date.month() + 1);
	let day   = zeropadding(date.date());
	return `https://www.w3.org/${date.year()}/${month}/${day}-${wg}-irc.txt`;
};

/**
 * Collect the full configuration information. This is a combination of four possible sources
 * of increasing priority
 * - default configuration (contains empty fields except for the date which set to 'today')
 * - user configuration, ie, $HOME/.scribejs
 * - configuration file provided via the command line
 * - additional configuration options in the command line
 *
 * @returns {object} - full configuration. See the overal manual for the field definitions
 */
exports.get_config = () => {
	/***********************************************************************/
	// First step: get the command line arguments. There is an error handling for undefined options
	let argument_config = {};
	program
		.usage('[options] [file]')
		.option('-d, --date [date]', 'date of the meeting in ISO (i.e., YYYY-MM-DD) format')
		.option('-r, --repo', 'whether the output should be stored in a github repository')
		.option('-g, --group [group]', 'name of the IRC channel used by the group')
		.option('-c, --config [config]', 'JSON configuration file')
		.option('-n, --nick [nicknames]', 'JSON file for nickname mappings')
		.option('-o, --output [output]', 'output file name')
		.option('-j,--jekyll', 'whether the output should be adapted to Github+Jekyll' )
		.on("--help", () => {
			console.log('    file:                  irc log file; if not present, retrieved from the W3C site');
		})
		.parse(process.argv);

	if(program.repo)   argument_config.torepo    = true;
	if(program.jekyll) argument_config.jekyll    = true;
	if(program.date)   argument_config.date      = moment(program.date);
	if(program.group)  argument_config.group     = program.group;
	if(program.output) argument_config.output    = program.output;
	if(program.nick)   argument_config.nicknames = program.nick
	if(program.args)   argument_config.input     = program.args[0]

	/***********************************************************************/
	// Second step: see if there is an explicit config file to be retreived
	let file_config = program.config ? exports.json_conf_file(program.config, true) : {};

	/***********************************************************************/
	// Third step: see if there is user level config file
	let user_config = (process.env.HOME) ? exports.json_conf_file(path.join(process.env.HOME, user_config_name), false) : {};

	/***********************************************************************/
	// Fourth step: combine the configuration in increasing priority order
	retval = _.extend(default_config, user_config, file_config, argument_config);

	/***********************************************************************/
	// Fifths step: sanity check and some cleanup on the configuration object

	// 1. If the group is provided and no explicit input, we should retreive the
	// IRC log from the W3C site
	// Note, however, if the group is set, the IRC URL is to be set in any case,
	// because that is the original one stored on the Web site,
	// ie, that must be referred to in the header of the minutes
	if(retval.group) {
		// Set the default IRC URL
		retval.orig_irc_log = exports.set_input_url(retval.date, retval.group);
		if(!retval.input) {
			retval.input = retval.orig_irc_log
		}
	}

	// 2. get read of the 'moment' object and use ISO date instead
	retval.date = retval.date.format("YYYY-MM-DD");

	// 3. if the input is not set, nothing should happen!
	if(!retval.input) {
		// There is nothing to do!!
		throw new Error("no irc log is provided; either an explicit file name or date and group name are needed");
	}

	// 4. if the github repo should be used, some values are required. If they are
	// present, the output file name for the repo can be generated, if needed
	if(retval.torepo) {
		let needed = [retval.ghname, retval.ghemail, retval.ghtoken, retval.ghrepo, retval.ghpath]
		if(_.every(needed, (val) => !_.isUndefined(val))) {
			retval.ghfname   = retval.output ? retval.output : `Minutes-${retval.date}.md`
			retval.ghmessage = `Added minutes for ${retval.date} at ${moment().format("YYYY-MM-DD H:m:s Z")}`
		} else {
			let message = "repository output is required, but not all values are provided.\n"
			let message2 = "are needed: ghname, ghemail, ghtoken, ghrepo, ghpath\n"
			throw new Error(message + message2 + JSON.stringify(retval, null, 2));
		}
	}

	return retval
}
