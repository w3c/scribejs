/**
* Get the arguments and/or configuration file
*/
const _      = require('underscore');
const moment = require('moment');
const fs     = require('fs');
const path   = require('path');


exports.get_config = () => {
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

	function set_input_url(date, wg) {
		/**
		* Return the URL to the input, namely the RSS IRC script URL on the HTTP Date space, namely
		*  https://www.w3.org/{year}/{month}/{day}-{wg}-irc.txt
		*/
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

	/* ====================================================================== */
	let default_config = {
		group  : null,
		date   : moment(),
		input  : null,
		output : null,
	}

	let argument_config = {};

	// First step: get the command line arguments
	let args = require('cli.args')('d:w:i:c:r:o:');
	// Date called out explicitly
	if(args.d !== undefined) argument_config.date  = moment(args.d);
	if(args.w !== undefined) argument_config.group = args.w;
	if(args.i !== undefined) argument_config.input = args.i;

	// See if there is a json configuration file whose that is explicitly provided:
	let file_config = (args.c !== undefined) ? json_conf_file(args.c, true) : {};
	let user_config = (process.env.HOME !== undefined) ? json_conf_file(path.join(process.env.HOME, ".scribejs.json"), false) : {};

	retval = _.extend(default_config, user_config, file_config, argument_config);

	// Some final cleanup:
	if(retval.group !== null && retval.input === null) {
		// Set the default IRC URL
		retval.input = set_input_url(retval.date, retval.group);
	}

	// Some assertion type thing should be raised here: if the input is not set, nothing should happen!
	if(retval.input === undefined || retval.input === null || retval.input === "") {
		// There is nothing to do!!
		console.error("Scribejs error: no input is provided");
		process.exit(-1);
	}
	return retval
}
