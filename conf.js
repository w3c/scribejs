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
			retval = JSON.parse(file_c);
			if(retval.date !== undefined && retval.date !== null) {
				retval.date = moment(retval.date);
			}
			return retval;
		} catch(e) {
			console.error(e);
			return {};
		}
	}

	function month_date(date) {
		/**
		* Extract the month and date numbers from a (moment) date object.
		* Care should be taken that the month and date numbers should be zero padded
		*
		* @param {moment} date
		* @returns {object} - {month, day} (both zero padded)
		*/
		let zeropadding = (n) => {
			if( n < 10 ) {
				return "0" + n
			} else {
				return "" + n
			}
		};
		return {
			month : zeropadding(date.month() + 1),
			day   : zeropadding(date.date()),
		}
	};

	/**
	 * Return the URL to the input, namely the RSS IRC script URL on the HTTP Date space, namely
	 *  https://www.w3.org/{year}/{month}/{day}-{wg}-irc.txt
	 *
	 * @param {moment} date
	 * @param {string} wg - the name of the wg/ig used when RRSAgent generates the IRC log
	 */
	function set_input_url(date, wg) {
		let {month, day} = month_date(date);
		let local  = day + "-" + wg + "-" + "irc.txt";
		return "https://www.w3.org/" + date.year() + "/" + month + "/" + local;
	};

	function set_output_url(date, repo) {
		/**
		* Return the URL to the output, namely the reference to the github repo of the form
		*  https://github.com/w3c/repo/minutes/{year}/{month}/{day}-minutes.md
		*/
		let {month, day} = month_date(date);
		let local  = day + "-" + "minutes.md";
		return "https://github.com/w3c/" + repo + "/minutes/" + date.year() + "/" + month + "/" + local;
	};

	let argument_config = {};
	// First step: get the command line arguments. There is an error handling for undefined variables
	let args = {};
	try {
		args = cli(['date:','d:', 'group:', 'g:', 'config:', 'c:', 'output:', 'o:', 'repo', 'r']);
	} catch(err) {
		throw new Error(`${err.message}\nUsage: ${err.usage}`);
	}

	// date first; this should be converted into a moment, but only if really defined
	let date = args.d || args.date;
	if(date !== undefined) argument_config.date = moment(date);

	// The group to which the minutes belong
	argument_config.group  = args.g || args.group;
	argument_config.torepo = (args.r === undefined && args.repo == undefined) ? false : true;
	argument_config.input  = (args.nonOpt !== undefined) ? args.nonOpt[0] : undefined;
	argument_config.output = (args.o || args.output);

	// prune the argument structure: remove the 'undefined' values that may have creeped in
	argument_config = _.chain(argument_config).pairs().filter((v) => !_.isUndefined(v[1])).object().value()

	// See if there is an extra config file to retrieved
	let extra_config_file = args.c || args.config

	// See if there is are json configuration files:
	let file_config = (extra_config_file !== undefined) ? json_conf_file(extra_config_file, true) : {};
	let user_config = (process.env.HOME !== undefined) ? json_conf_file(path.join(process.env.HOME, ".scribejs.json"), false) : {};

	// This is the magic that combines the configuration in priority
	retval = _.extend(default_config, user_config, file_config, argument_config);

	// Some final cleanup:
	if(retval.group !== null && !retval.input) {
		// Set the default IRC URL
		retval.input = set_input_url(retval.date, retval.group);
	}
	retval.date = retval.date.format("YYYY-MM-DD");

	// Some assertion type thing should be raised here
	// 1. if the input is not set, nothing should happen!
	if(retval.input === undefined || retval.input === null || retval.input === "") {
		// There is nothing to do!!
		throw new Error("no irc log is provided");
	}

	// 2. if the repo should be used, some values are required. If they are
	// present, the output file name for the repo can be generated
	if(retval.torepo) {
		let needed = [retval.ghname, retval.ghemail, retval.ghtoken, retval.ghrepo, retval.ghpath]
		if(_.every( needed, (val) => !_.isUndefined(val))) {
			retval.ghfname   = `Minutes-${retval.date}`
			retval.ghmessage = `Added minutes for ${retval.date} at ${moment().format("YYYY-MM-DD H:m:s Z")}`
		} else {
			let message = "repository output is required, but not all values are provided.\n"
			let message2 = "are needed: ghname, ghemail, ghtoken, ghrepo, ghpath"
			throw new Error(message + message2);
		}
	}

	return retval
}
