/**
* Get the arguments and/or configuration file
*/
const _      = require('underscore');
const moment = require('moment');
const fs     = require('fs');
const path   = require('path');
const cli    = require('cli.args');

let default_config = {
	date   : moment(),
}

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
	/**
	* Read a configuration file
	*
	* @param {string} fname - file name
	* @param {boolean} warn - whether an error warning should be sent to the standard error if there are issues
	* @returns {object} - the parsed JSON content
	*/
	function json_conf_file(fname, warn) {
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
	}

	/**
	 * Return the URL to the input: the RSS IRC script URL on the HTTP Date space, namely
	 *  https://www.w3.org/{year}/{month}/{day}-{wg}-irc.txt. The all date values are zero padded.
	 *
	 * @param {moment} date
	 * @param {string} wg - the name of the wg/ig used when RRSAgent generates the IRC log
	 */
	function set_input_url(date, wg) {
		let zeropadding = (n) => (n < 10 ? "0" + n : "" + n);
		let month = zeropadding(date.month() + 1);
		let day   = zeropadding(date.date());
		return `https://www.w3.org/${date.year()}/${month}/${day}-${wg}-irc.txt`;
	};

	/***********************************************************************/
	// First step: get the command line arguments. There is an error handling for undefined options
	let argument_config = {};
	let args            = {};
	try {
		args = cli(['help', '-h', 'date:','d:', 'group:', 'g:', 'config:', 'c:', 'output:', 'o:', 'repo', 'r']);
	} catch(err) {
		throw new Error(`${err.message}\nUsage: ${err.usage}`);
	}

	// Handle the help options
	if(args.help || args.h) {
		console.log(args.info.usage)
		process.exit(0)
	}

	// Date must be converted into a moment, but only if it really exists
	let date = args.d || args.date;
	if(date) argument_config.date = moment(date);

	// The group to which the minutes belong
	argument_config.group  = args.g || args.group;

	// Whether the target is a repo or not
	argument_config.torepo = (args.r || args.repo) ? true : false;

	// Explicit output?
	let output = args.o || args.output;
	if(output) argument_config.output = output;

	// Explicit input?
	if(args.nonOpt) argument_config.input = args.nonOpt[0];

	// prune the argument structure: remove the 'undefined' values that may have creeped in
	argument_config = _.chain(argument_config).pairs().filter((v) => !_.isUndefined(v[1])).object().value()

	/***********************************************************************/
	// Second step: see if there is an explicit config file to be retreived
	let extra_config_file = args.c || args.config
	let file_config = (extra_config_file) ? json_conf_file(extra_config_file, true) : {};

	/***********************************************************************/
	// Third step: see if there is user level config file
	let user_config = (process.env.HOME) ? json_conf_file(path.join(process.env.HOME, ".scribejs.json"), false) : {};

	/***********************************************************************/
	// Fourth step: combine the configuration in increasing priority order
	retval = _.extend(default_config, user_config, file_config, argument_config);

	/***********************************************************************/
	// Fifths step: sanity check and some cleanup on the configuration object

	// 1. If the group is provided and no explicit input, we should retreive the
	// IRC log from the W3C site
	if(retval.group && !retval.input) {
		// Set the default IRC URL
		retval.input = set_input_url(retval.date, retval.group);
	}

	// 2. get read of the 'moment' object and use ISO date instead
	retval.date = retval.date.format("YYYY-MM-DD");

	// 3. if the input is not set, nothing should happen!
	if(!retval.input) {
		// There is nothing to do!!
		throw new Error("no irc log is provided");
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
