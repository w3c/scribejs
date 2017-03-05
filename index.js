#!/usr/bin/env node
/**
 * Convert W3C’s RRSAgent IRC bot output into minutes in Markdown
 *
 * @version: 0.5.0
 * @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
 * @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 */

/******************************************************/
/* This is just the overall driver of the script...   */
/******************************************************/

// 1. Get the overall configuration data; this is a combination of
//    configuration files and command line arguments
const config  = require('./conf').get_config();

// console.log(JSON.stringify(config))
// process.exit(0)


// 2. Get the IRC Log; depending on the configuration, this is
//    either retrieved from the W3C web site or from a local file
// Get the configuration data
const io      = require('./io');
const convert = require('./convert');
io.get_irc_log(config)
	// 3. Convert the irc log into markdown content
	.then((irc_log) => {
		return convert.to_markdown(config.input, irc_log);
	})
	// 4. Either upload the minutes to Github or dump into a local file
	.then((minutes) => {
		console.log(minutes)
	})
	.catch((err) => {
		console.error(err)
	});
