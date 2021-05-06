"use strict";
/**
 *
 * Collection of methods to perform, essentially I/O operations. These include:
 *
 * * Get the IRC log itself
 * * Get the nickname file
 * * Dump the generated minutes into a file or upload it to github.
 *
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.output_minutes = exports.get_nick_mapping = exports.get_irc_log = exports.fetch_text = void 0;
const url = require("url");
const node_fetch = require("node-fetch");
const fs = require("fs");
const validUrl = require("valid-url");
const githubapi_1 = require("./js/githubapi");
const types_1 = require("./types");
const utils = require("./utils");
/** @internal */
const fsp = fs.promises;
/**
 * The effective fetch implementation run by the rest of the code.
 *
 * There is no default fetch implementation for `node.js`, hence the necessity to import 'node-fetch'. However, if the code
 * runs in a browser, there is an error message whereby only the fetch implementation in the Window is acceptable.
 *
 * This variable is a simple, polyfill like switch between the two, relying on the existence (or not) of the
 * `process` variable (built-in for `node.js`).
 *
 * I guess this makes this entry a bit polyfill like:-)
 */
const my_fetch = utils.is_browser ? fetch : node_fetch.default;
/**
 * Get a text file.
 *
 * The input provided in the configuration is examined whether
 * it is a URL (in which case this is retrieved via HTTP) or not (in which case
 * it is considered to be a local file). Returns a Promise with the content
 * of the input as one string.
 *
 * @param input - URL or file name
 * @returns a promise containing the text content as a single string.
 * @async
 */
async function fetch_text(input) {
    if (url.parse(input).protocol !== null) {
        const response = await my_fetch(input);
        if (response.ok) {
            const content_type = response.headers.get('content-type').split(';')[0];
            if (types_1.Constants.text_media_types.includes(content_type)) {
                return response.text();
            }
            else {
                throw new Error(`IRC log must be of type text/plain, it is ${content_type}`);
            }
        }
        else {
            throw new Error(`HTTP response ${response.status}: ${response.statusText}`);
        }
    }
    else {
        return fsp.readFile(input, 'utf-8');
    }
}
exports.fetch_text = fetch_text;
/**
 * Get the IRC log. The input provided in the configuration is examined whether
 * it is a URL (in which case this is retrieved via HTTP) or not (in which case
 * it is considered to be a local file). Returns a Promise with the content
 * of the input as one string.
 *
 * @param conf - Overall configuration; the only field that matter here is "conf.input"
 * @returns a promise containing the irc log as a single string.
 * @async
 */
async function get_irc_log(conf) {
    if (conf.irclog) {
        // This field may be present if called from a CGI script, and the IRC log
        // is uploaded
        return conf.irclog;
    }
    else {
        return fetch_text(conf.input);
    }
}
exports.get_irc_log = get_irc_log;
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
* 1. Check whether the protocol is http(s). Other protocols are not accepted (actually rejected by fetch, too)
* 2. Run the URL through a valid-url check, which looks at the validity of the URL in terms of characters used, for example
* 3. Check that the port (if specified) is in the allowed range, ie, > 1024
* 4. Don't allow localhost in a CGI answer...
*
* @param address: the URL to be checked.
* @return the URL itself (which might be slightly improved by the
*     valid-url method) or null if this is, in fact, not a URL
* @throws if it pretends to be a URL, but it is not acceptable for some reasons.
*/
function check_url(address) {
    const parsed = url.parse(address);
    if (parsed.protocol === null) {
        // This is not a URL, should be used as a file name
        return null;
    }
    // Check whether we use the right protocol
    if (['http:', 'https:'].includes(parsed.protocol) === false) {
        throw new Error(`Only http(s) url-s are accepted (${address})`);
    }
    // Run through the URL validator
    const retval = validUrl.isWebUri(address);
    if (retval === undefined) {
        throw new Error(`The url ${address} isn't valid`);
    }
    // Check the port
    if (parsed.port !== null && Number.parseInt(parsed.port, 10) <= 1024) {
        throw new Error(`Unsafe port number used in ${address} (${parsed.port})`);
    }
    // Don't allow local host in a CGI script...
    // (In Bratt's python script (<http://dev.w3.org/2004/PythonLib-IH/checkremote.py>) this step was much
    // more complex, and has not yet been reproduced here...
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        throw new Error(`Localhost is not accepted in ${address}`);
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
 * @param conf - Overall configuration; the only field that matter here is "conf.nicknames"
 * @returns - a promise containing the nicknames as an object parsed from JSON.
 * @async
 */
async function get_nick_mapping(conf) {
    /**
    * Minimal cleanup on nicknames: allow irc log to be lower or upper case,
    * internal comparisons should use the lower case only
    */
    const lower_nicks = (nicks) => {
        return nicks.map((nick_structure) => {
            const lowered = nick_structure.nick.map((nick) => nick.toLowerCase());
            nick_structure.nick = lowered;
            return nick_structure;
        });
    };
    if (conf.nicknames) {
        const address = check_url(conf.nicknames);
        if (address !== null) {
            const response = await my_fetch(address);
            if (response.ok) {
                const nicks = await response.json();
                return lower_nicks(nicks);
            }
            else {
                throw new Error(`HTTP response ${response.status}: ${response.statusText}`);
            }
        }
        else {
            const nicks = await fsp.readFile(conf.nicknames, 'utf-8');
            try {
                const json_content = JSON.parse(nicks);
                return lower_nicks(json_content);
            }
            catch (e) {
                throw new Error(`JSON parsing error in ${conf.nicknames}: ${e}`);
            }
        }
    }
    else {
        return [];
    }
}
exports.get_nick_mapping = get_nick_mapping;
/**
 * Committing new markdown file on the github repo.
 *
 * The following terms in the configuration are relevant for this function
 * - `ghrepo`: the full name of the repository. E.g., "w3c/scribejs"
 * - `ghpath`: the path within the repository where the data must be stored. E.g., "test/minutes"
 * - `ghfname`: the file name
 * - `ghtoken`: the user's OAUTH personal access token provided by GitHub (see https://github.com/settings/tokens/new)
 * - `ghbranch`: the target branch within the repository. This term may be missing from the configuration, in which case the default branch of the repo is used
 *
 * The real work is done in the [[GitHub]] interface to Github.
 *
 * @param data - the markdown file to be uploaded
 * @param conf - the configuration containing the necessary data for upload.
 * @returns the returned promise data is the URL of the content; its only use is for debug
 * @async
 */
async function commit(data, conf) {
    // The token below is essential, it gives the access right to the repository.
    // See GH documentation how to obtain it...
    const gh = new githubapi_1.GitHub(conf.ghrepo, conf);
    return gh.commit_data(data);
}
/**
 * Output the minutes. Depending on the configuration, the values are stored in a file or on
 * a GitHub repository.
 *
 * @param  minutes - the markdown data to be uploaded
 * @param conf - the configuration containing additional data
 * @returns the returned promise data with the file name or URL of the generated minutes
 * @async
 */
async function output_minutes(minutes, conf) {
    if (conf.torepo) {
        try {
            const retval = await commit(minutes, conf);
            return retval;
        }
        catch (e) {
            throw new Error(`Problem writing repository ${conf.torepo}; ${e}`);
        }
    }
    else if (conf.output) {
        try {
            await fsp.writeFile(conf.output, minutes, 'utf-8');
            return conf.output;
        }
        catch (e) {
            throw new Error(`Problem writing local file ${conf.output}; ${e}`);
        }
    }
    else {
        console.log(minutes);
        return '';
    }
}
exports.output_minutes = output_minutes;
//# sourceMappingURL=io.js.map