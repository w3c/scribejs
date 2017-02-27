#!/usr/bin/env node
// Get the configuration data
const config = require('./conf').get_config();
// console.log(JSON.stringify(config))

/************************************************************/

/**
*
*/
function dispose_output(md_content) {
	console.log(md_content)
}

/*
* Get the input. The real work is done in convert.to_markdown,
* which is called asynchronously.
*
*/
// Error handling must be added!!!
const url     = require('url');
const convert = require('./convert');
if( url.parse(config.input).protocol !== null ) {
	// This is a resource on the Web that must be fetched
	const fetch  = require('node-fetch');
	fetch(config.input)
		.then((response) => {
			if(response.ok) {
				return response.text()
			} else {
				throw new Error(`HTTP response ${response.status}: ${response.statusText}`);
			}
		})
		.then((body) => {
			dispose_output(convert.to_markdown(config.input, body));
		})
		.catch((err) => {
			console.error(`Problem accessing ${config.input}; ${err.message}`)
			process.exit(-1);
		})
} else {
	// This is a local file that must be read
	const fs = require('fs');
	fs.readFile(config.input, 'utf-8', (err,body) => {
		if(err) {
			console.error(`Problem reading ${config.input}; ${err}`)
			process.exit(-1);
		} else {
			dispose_output(convert.to_markdown(config.input, body));
		}
	})
}
