#!/usr/bin/env node
"use strict";

/**
 * Convert W3C’s RRSAgent IRC bot output into minutes in Markdown
 *
 * @version: 1.0.0
 * @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
 * @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 */

const debug   = false;
const io      = require('./io');
const convert = require('./convert');
const conf    = require('./conf');

let schemas = {}
try {
	schemas = require('./schemas');
} catch(err) {
	console.error(`Scribejs ${err}`);
	// process.exit();
}

/******************************************************/
/* This is just the overall driver of the script...   */
/******************************************************/

async function main() {
	try {
		// Collect and combine the configuration file
		// Note that the get_config method is synchronous (uses a sync version of file system access)
		let config = conf.get_config();
		if(debug) {
			console.log(JSON.stringify(config, null, 2));
		}
		
		// Get the nickname mappings object. The result gets added to the configuration
		config.nicks = await io.get_nick_mapping(config);

		// Validate the nickname mapping object against the appropriate JSON schema
		let valid = schemas.validate_nicknames(config.nicks);
		if( !valid ) {
			// throw `validation error in nicknames:\n${schemas.validation_errors(schemas.validate_nicknames)}`;
			console.warn(`Warning: scribejs validation error in nicknames:\n${schemas.validation_errors(schemas.validate_nicknames)}`);
			console.warn(`(nicknames ignored)`);
			config.nicks = [];
		}

		// Get the IRC log itself
		let irc_log = await io.get_irc_log(config);

		// The main step: convert the IRC log into a markdown text
		let minutes = convert.to_markdown(irc_log, config);

		// Either upload the minutes to Github or dump into a local file
		let message = await io.output_minutes(minutes, config);

		// That is it, folks!
		console.log(message);
	} catch(err) {
		console.error(`Scribejs ${err}`);
		// process.exit();
	}
}

// Do it!
main()
