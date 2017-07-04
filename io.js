#!/usr/bin/env node
/**
 *
 * Uploading a new minute to github. If the minute is already there, it will be updated, otherwise
 * a new file is created.
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
 * (in which case this is retrived via HTTP) or not (in which case it is considered to be a local file). Returns a Promise
 * with the content of the input as an object.
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
 * @returns {Promise} - the returned promise data with just an acknowledgement
 */
exports.output_minutes = (minutes, conf) => {
	return new Promise((resolve, reject) => {
		if(conf.torepo) {
			// This must be stored in a github repository
			//console.log(JSON.stringify(conf, null, 2))
			commit(minutes, conf)
			  .then((url) => resolve(`Minutes are in ${url}`))
			  .catch((err) => reject(err))
		} else {
			if(conf.output) {
				fs.writeFile(conf.output, minutes, (err) => {
					if(err) {
						reject(`problem writing local file ${conf.output}; ${err}`);
					} else {
						resolve(`Minutes are in ${conf.output}`)
					}
				})
			} else {
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
 *
 * @param {string} data - the markdown data to be uploaded
 * @param {object} conf - the configuration containing additional data
 * @returns {Promise} - the returned promise data is whatever the github API returns; usable for debug
 */
function commit(data, conf) {
	const gh = new octokat({token: conf.ghtoken});
	const repo = conf.ghrepo.split('/');
	const url = `${conf.ghpath}${conf.ghfname}` + (conf.ghbranch ? `?ref=${conf.ghbranch}` : '');
	return new Promise((resolve, reject) => {
		const upload = (resolve, reject, sha = null) => {
			const params = {
				sha: sha,
				path: conf.ghpath,
				branch: conf.ghbranch,
				message: conf.ghmessage,
				content: Buffer.from(data).toString('base64'),
				committer: {
					name: conf.ghname,
					email: conf.ghemail
				}
			};
			gh.repos(...repo).contents(`${conf.ghfname}`).add(params)
				.then((info) => {
					if (info && info.content && info.content.htmlUrl)
						resolve(info.content.htmlUrl);
					else
						reject(info);
				})
				.catch(err => reject (err));
		};
		gh.repos(...repo).contents(url).fetch()
			.then((info) => {
				if (info)
					upload(resolve, reject, info.sha ? info.sha : null);
			})
			.catch(err => upload(resolve, reject));
	});
}
