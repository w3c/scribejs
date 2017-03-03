#!/usr/bin/env node
/**
 *
 * Uploading a new minute to github. If the minute is already there, it will be updated, otherwise
 * a new file is created.
 *
 * For the moment, the default (ie, 'master') branch is used.
 *
 */
const fetch  = require('node-fetch');

/**
 * Committing new data on the github repo
 *
 * The following terms in the configuration are relevant for this function
 * - repo: the full name of the repository. E.g., "w3c/scribejs"
 * - path: the path within the repository where the data must be stored. E.g., "test/minutes"
 * - ghname: the user name to be used when committing
 * - ghemail: the user email to be used when committing
 * - ghtoken: the user's OAUTH personal access token provided by GitHub (see https://github.com/settings/tokens/new)
 *
 *
 * @param {string} data - the markdown data to be uploaded
 * @param {string} fname - the file name to be created/or uploaded
 * @param {string} commit_message - the message for the commit_message
 * @param {object} conf - the configuration containing additional data
 * @returns {Promise} - the returned promise data is whatever the github API returns; usable for debug
 */
function commit(data, fname, commit_message, conf) {
	// Collecting the data from the configuration
	uri = `https://api.github.com/repos/${conf.repo}/contents/${conf.path}/${fname}`
	// This is the message for the PUT action. Note that base64 encoding of the data,
	// this is required by the GitHub API
	let message = {
		"message" : commit_message,
		"committer" : {
			"name"  : conf.ghname,
			"email" : conf.ghemail
		},
		"content" : Buffer.from(data).toString('base64'),
	};

	// Before uploading we have to see if the file already exists or not. If it does
	// we need the sha number of that resource; this is needed to be able to modify the
	// content.
	//
	// This means: first we make a GET on the target resource; if the resources is there
	// we retrieve the sha value from the return value, which must be added to the "message"
	// object above. As a second step, we make a PUT with the new data.
	return new Promise( (resolve,reject) => {
		// Try to fetch the data.
		fetch(uri, {
			headers: {
				'Authorization' : `token ${conf.ghtoken}`
			}
		})
		.then((response) => {
			// If there *is* a response, that includes the magic sha number which which we need.
			// We just send it to the next step (remember that response.text() returns a promise,
		    // so we have to do the processing in the next step below...)
			if(response.ok) {
				return response.text();
			} else {
				return null;
			}
		})
		.then((body) => {
			// fill in the sha value if we need it
			if(body !== null) {
				message.sha = JSON.parse(body).sha;
			}
			// off we go with the upload
			fetch(uri,{
				method: 'PUT',
				headers: {
					'Accept'        : 'application/json',
					'Content-type'  : 'application/json',
					'Authorization' : `token ${conf.ghtoken}`
				},
				body : JSON.stringify(message)
			}).then((res) => {
				resolve(res)
			}).catch((err) => {
				reject(err);
			});
		})
		.catch((err) => {
			reject(err);
		})
	})
}


/*********************************************************************
                            Testing
**********************************************************************/
const moment = require('moment');

test = `# Test data
This is just to test whether I can upload or change, programatically,
a markdown file on github...

_We shall see!_

Time of generation: ${moment()}
`

myconf = {
	'ghname'  : 'iherman',
	'ghemail' : 'ivan@w3.org',
	'ghtoken' : '1234567890-1234567892345678', // phony!!!
	'repo'    : 'w3c/scribejs',
	'path'    : 'test/Minutes'
}

commit(test, "test5.md", `testing upload at ${moment()}`, myconf )
	.then((m)=>{
		console.log(`yes, something happened...: ${JSON.stringify(m)}`)
	})
	.catch((err) => {
		console.log(`oops, an error occured: ${err.message}`)
	})
