#!/usr/bin/env node
/**
 *
 * Collection of methods to perform, essentially I/O operations. This include:
 *
 * * Get the IRC log itself
 * * Get the nickname file
 * * Dump the generated minutes into a file or upload it to github.
 *
 * For the moment, the default (ie, 'master') branch is used.
 *
 */
const url     = require('url');
const fetch   = require('node-fetch');
const fs      = require('fs');
const _       = require('underscore');
const octokat = require('octokat');

/**
 * Get the IRC log. The input provided in the configuration is examined whether it is a URL (in which case
 * this is retrived via HTTP) or not (in which case it is considered to be a local file). Returns a Promise
 * with the content of the input as one string.
 *
 * @param {object} conf - Overall configuration; the only field that matter here is "conf.input"
 * @returns {Promise} - a promise containing the irc log as a single string.
 */
exports.get_irc_log = (conf) => {
	return new Promise((resolve, reject) => {
		if(conf.irclog) {
			// This field may be present if called from a CGI script, and the IRC log
			// is uploaded
			resolve(conf.irclog);
		} else if(url.parse(conf.input).protocol !== null) {
			// This is a resource on the Web that must be fetched
			fetch(conf.input)
				.then((response) => {
					if(response.ok) {
						return response.text()
					} else {
						throw new Error(`HTTP response ${response.status}: ${response.statusText}`);
					}
				})
				.then((body) => {
					// Resolve the returned Promise
					resolve(body);
				})
				.catch((err) => {
					reject(`problem accessing remote file ${conf.input}: ${err.message}`)
				})
		} else {
			// This is a local file. Use an async function to retrieve the file,
			// though, I believe, a sync function would work just as well
			fs.readFile(conf.input, 'utf-8', (err, body) => {
				if(err) {
					reject(`problem access local file ${conf.input}: ${err}`);
				} else {
					resolve(body);
				}
			});
		}
	});
};


/**
 * Get the nickname mapping file (if any). The input provided in the configuration is examined whether it is a URL
 * (in which case this is retrived via HTTP) or not (in which case it is considered to be a local file).
 * Returns a Promise with the content of the input as an object.
 *
 * @param {object} conf - Overall configuration; the only field that matter here is "conf.nickname"
 * @returns {Promise} - a promise containing the irc log as a single string.
 */
exports.get_nick_mapping = (conf) => {
	/**
	* Minimal cleanup on nicknames: allow irc log to be lower or upper case,
	* internal comparisons should use the lower case only
	*/
	function lower_nicks(nicks) {
		return _.map(nicks, (nick_structure) => {
			let lowered = _.map(nick_structure.nick, (nick) => nick.toLowerCase());
			nick_structure.nick = lowered;
			return nick_structure;
		})
	}
	return new Promise((resolve, reject) => {
		if(conf.nicknames) {
			if(url.parse(conf.nicknames).protocol !== null) {
				// This is a resource on the Web that must be fetched
				fetch(conf.nicknames)
					.then((response) => {
						if(response.ok) {
							return response.json()
						} else {
							throw new Error(`HTTP response ${response.status}: ${response.statusText}`);
						}
					})
					.then((body) => {
						// Resolve the returned Promise
						resolve(lower_nicks(body));
					})
					.catch((err) => {
						reject(`problem accessing remote file ${conf.nicknames}: ${err.message}`)
					})
			} else {
				// This is a local file. Use an async function to retrieve the file,
				// though, I believe, a sync function would work just as well
				fs.readFile(conf.nicknames, 'utf-8', (err, body) => {
					if(err) {
						reject(`problem access local file ${conf.nicknames}: ${err}`);
					} else {
						resolve(lower_nicks(JSON.parse(body)));
					}
				});
			}
		} else {
			resolve({});
		}
	});
};


/**
 * Output the minutes. Depending on the configuration, the values are stored in a file or on
 * a GitHub repository.
 *
 * @param {string} data - the markdown data to be uploaded
 * @param {object} conf - the configuration containing additional data
 * @returns {Promise} - the returned promise data with the file name or URL of the generated minutes
 */
exports.output_minutes = (minutes, conf) => {
	return new Promise((resolve, reject) => {
		if(conf.torepo) {
			// This must be stored in a github repository
			commit(minutes, conf)
			  .then((url) => resolve(`Minutes are in ${url}`))
			  .catch((err) => reject(err))
		} else {
			if(conf.output) {
				// This is a local file. Use an async function to dump the file,
				// though, I believe, a sync function would work just as well
				fs.writeFile(conf.output, minutes, (err) => {
					if(err) {
						reject(`Problem writing local file ${conf.output}; ${err}`);
					} else {
						resolve(`Minutes are in ${conf.output}`)
					}
				})
			} else {
				// Just send the minutes to the standard output. May come be handy 
				// for debug
				console.log(minutes);
				resolve("")
			}
		}
	});
}


/**
 * Committing new data on the github repo
 *
 * The following terms in the configuration are relevant for this function
 * - ghrepo: the full name of the repository. E.g., "w3c/scribejs"
 * - ghpath: the path within the repository where the data must be stored. E.g., "test/minutes"
 * - ghfname: the file name
 * - ghname: the user name to be used when committing
 * - ghemail: the user email to be used when committing
 * - ghtoken: the user's OAUTH personal access token provided by GitHub
 *             (see https://github.com/settings/tokens/new)
 * - ghbranch: the target branch within the repository. This term may be missing from the configuration,
 *             in which case the repo's default branch is used
 *
 * @param {string} data - the markdown data to be uploaded
 * @param {object} conf - the configuration containing additional data
 * @returns {Promise} - the returned promise data is whatever the github API returns; usable for debug
 */
 // The GH access is done via the octokat library (https://www.npmjs.com/package/octokat). See
 // https://github.com/philschatz/octokat.js/tree/c6f38e5bd7b2dadeb9066eaae2e8a762354795d8/examples
 // for a set of examples which is an attempt to replace a proper documentation...
 //
 // This library provides a more consise layer on top of the official Github API:
 // https://developer.github.com/v3
function commit(data, conf) {
	// The token below is essential, it gives the access right to the repository. See GH documentation
	// how to obtain it...
	const gh               = new octokat({token: conf.ghtoken});
	const repo             = conf.ghrepo.split('/');
	const path             = `${conf.ghpath}/${conf.ghfname}`
	const path_with_branch = path + (conf.ghbranch ? `?ref=${conf.ghbranch}` : '');
	// Before uploading we have to see if the file already exists or not. If it does
    // we need the sha number of that resource; this is needed to be able to modify the
    // content.
    //
    // This means: first we make a GET on the target resource; if the resources is there
    // we retrieve the sha value from the return value, which must be added to the "message"
    // object used to update or upload the real content. This last step is done in the 'upload' function.
	//
	return new Promise((resolve, reject) => {
		// This function uploads the data with or without an sha value
		const upload = (resolve, reject, sha = null) => {
			const params = {
				sha:     sha,
				branch:  conf.ghbranch,
				message: conf.ghmessage,
				content: Buffer.from(data).toString('base64'),
				committer: {
					name: conf.ghname,
					email: conf.ghemail
				}
			};
			// The gh...content idiom returns an object, and the 'add' verb is used to add content to it.
			// The parameter is the full message for the GH API, including the real content (encoded)
			gh.repos(...repo).contents(path).add(params)
				.then( (info) => {
					if (info && info.content && info.content.htmlUrl) {
						resolve(info.content.htmlUrl);
					} else {
						reject(info);
					}
				})
				.catch(err => reject(err))
		};

		// The gh...content idiom with a path returns an object that can be 'fetched' information about the content
		gh.repos(...repo).contents(path_with_branch).fetch()
			.then((info) => {
				if (info) {
					// If the file really exists, then it has an sha that should be reused...
					upload(resolve, reject, info.sha ? info.sha : null);
				}
			})
			.catch(err => {
				// This means that file is unknown in the repository, ie, should be created from scratch
				upload(resolve, reject)
			});
	});
}
