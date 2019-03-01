/* eslint-disable no-alert */
/* eslint-env browser */

'use strict';

/**
 * Get the nickname files via its URL, with a basic sanity check on the URL
 * (Just to be on the safe side)
 */

const url      = require('url');
const validUrl = require('valid-url');
const _        = require('underscore');

/**
* Basic sanity check on the URL.
*
* The function returns a (possibly slightly modified) version of the URL if
* everything is fine, or a null value if the input argument is not a URL (but
* should be used as a filename)
*
* There might be errors, however, in the case it is a URL. In such cases the
* function raises an exception; this should be caught to end all processing.
*
* The checks are as follows:
*
* 1. Check whether the protocol is http(s). Other protocols are not accepted
*    (actually rejected by fetch, too)
* 2. Run the URL through a valid-url check, which looks at the validity of the
*    URL in terms of characters used, for example
* 3. Check that the port (if specified) is in the allowed range, ie, > 1024
* 4. Don't allow localhost in a CGI answer...
*
* @param {string} _address: the URL to be checked.
* @return {string}: the URL itself (which might be slightly improved by the
*     valid-url method) or null this is, in fact, not a URL
* @throws {exception}: if it pretends to be a URL, but it is not acceptable for some reasons.
*/
function check_url(_address) {
    const address = _address.trim();
    const parsed = url.parse(address);
    if (parsed.protocol === null) {
        // This is not a URL, should be used as a file name
        return null;
    }
    // Check whether we use the right protocol
    if (_.contains(['http:', 'https:'], parsed.protocol) === false) {
        throw new Error(`Only http(s) url-s are accepted (${address})`);
    }

    // Run through the URL validator
    const retval = validUrl.isWebUri(address);
    if (retval === undefined) {
        throw new Error(`The url ${address} isn't valid`);
    }

    // Check the port
    if (parsed.port !== null && parsed.port <= 1024) {
        throw new Error(`Unsafe port number used in ${address} (${parsed.port})`);
    }

    // If we got this far, this is a proper URL, ready to be used.
    return retval;
}

/**
 * Get the nickname mapping file (if any). The input provided in the
 * configuration is examined whether it is a URL (in which case this is
 * retrieved via HTTP) or not (in which case it is considered to be a local file).
 * Returns a Promise with the content of the input as an object.
 *
 * @param {object} conf - Overall configuration; the only field that matter
 *     here is "conf.nicknames"
 * @returns {Promise} - a promise containing the nicknames as an object parsed from JSON.
 */
exports.get_nick_mapping = (conf) => {
    /**
    * Minimal cleanup on nicknames: allow irc log to be lower or upper case,
    * internal comparisons should use the lower case only
    */
    function lower_nicks(nicks) {
        return _.map(nicks, (nick_structure) => {
            const lowered = _.map(nick_structure.nick, (nick) => nick.toLowerCase());
            nick_structure.nick = lowered;
            return nick_structure;
        });
    }
    return new Promise((resolve, reject) => {
        if (conf.nicknames) {
            const address = check_url(conf.nicknames);
            if (address !== null) {
                // This is a resource on the Web that must be fetched
                fetch(address)
                    .then((response) => {
                        if (response.ok) {
                            // I need to check whether the returned data is genuine json; however,
                            // alas!, github does not set the content type of the returned raw data
                            // to json, ie, the response header cannot be used for that purpose.
                            // Instead, the value is sent to a next step to parse it explicitly
                            return response.text();
                        }
                        reject(new Error(`HTTP response ${response.status}: ${response.statusText}`));
                    })
                    .then((body) => {
                        // Try to parse the content as JSON and, if it works, that is almost
                        // the final result, module turn all the nicknames to lowercase
                        let json_content = {};
                        try {
                            json_content = JSON.parse(body);
                        } catch (err) {
                            alert(`JSON parsing error in ${conf.nicknames}: ${err}`);
                            reject(new Error(`JSON parsing error in ${conf.nicknames}: ${err}`));
                        }
                        resolve(lower_nicks(json_content));
                    })
                    .catch((err) => {
                        alert(`problem accessing remote file ${conf.nicknames}: ${err.message}`);
                        reject(new Error(`problem accessing remote file ${conf.nicknames}: ${err.message}`));
                    });
            }
        } else {
            resolve([]);
        }
    });
};
