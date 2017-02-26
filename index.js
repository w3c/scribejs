#!/usr/bin/env node

/*********************************************************************************/
/*                              Some local utilities                             */
/*********************************************************************************/
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

/*********************************************************************************/
/*
             Get the right information from the command line:
              - date of the meeting (defaults to today)
              - WG name (used to establish the URI of the IRC minutes)
              - Repository name (used to establish the target in github)
			  - input file (if not to be fetched from the Web)
			  - output file (if not to be pushed onto github)
*/
/*********************************************************************************/
const moment = require('moment');
let args  = require('cli.args')('d:w:r:i:o:'),
	// Note: if the args.d is undefined, this returns the current date!
	date  = moment(args.d),
	wg    = args.w  || 'dpub',
	repo  = args.r  || 'testrepo';
let inp  = args.i || set_input_url(date, wg);
let outp = args.o || set_output_url(date, repo);

/************************************************************/

function dispose_output(md_content) {
	console.log(md_content)
}


/*
  Get the input. The real work is done in an async function
*/
// Error handling must be added!!!
const url     = require('url');
const convert = require('./convert');
if( url.parse(inp).protocol !== null ) {
	// This is a resource on the Web that must be fetched
	const fetch  = require('node-fetch');
	fetch(inp)
		.then((response) => response.text())
		.then(function(body){
			dispose_output(convert.to_markdown(inp, body));
		})
} else {
	// This is a local file that must be read
	const fs = require('fs');
	fs.readFile(inp, 'utf-8', (err,body) => {
		if(err) throw err;
		dispose_output(convert.to_markdown(inp, body));
	})
}
