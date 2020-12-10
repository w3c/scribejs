"use strict";
/**
 *
 * Collection of utility functions, put here for a better maintenance
 *
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.add_links = exports.perform_change_requests = exports.perform_insert_requests = exports.separate_header = exports.cleanup = exports.get_name_list = exports.canonical_nick = exports.get_label = exports.every = exports.flatten = exports.difference = exports.union = exports.uniq = exports.zip = exports.today = exports.is_browser = void 0;
const types_1 = require("./types");
const url = require("url");
/** ******************************************************************* */
/*                       Conversion generic utilities                   */
/** ******************************************************************* */
/** (Calculated) constant to decide whether the code runs in a browser or via node.js */
exports.is_browser = (process === undefined || process.title === 'browser');
/** (Calculated) constant for today's date in ISO format */
exports.today = new Date().toISOString().split('T')[0];
/**
 * "Zip" two arrays, i.e., create an array whose elements are pairs of the corresponding elements in the two arrays being processed.
 */
function zip(left, right) {
    const l = (left.length <= right.length) ? left.length : right.length;
    const retval = [];
    for (let i = 0; i < l; i++) {
        retval.push([left[i], right[i]]);
    }
    return retval;
}
exports.zip = zip;
/**
 * Remove duplicates from an array
 */
function uniq(inp) {
    return [...new Set(inp)];
}
exports.uniq = uniq;
/**
 * Union of two arrays ('union' in a set-theoretic sense, i.e., with no duplicates)
 * @param a
 * @param b
 */
function union(a, b) {
    const sa = new Set(a);
    for (const entry of b) {
        sa.add(entry);
    }
    return [...sa];
}
exports.union = union;
/**
 * Difference of two arrays ('difference' in a set-theoretic sense, i.e., generating `a \ b`)
 *
 * @param a
 * @param b
 */
function difference(a, b) {
    const sa = new Set(a);
    for (const entry of b) {
        sa.delete(entry);
    }
    return [...sa];
}
exports.difference = difference;
/**
 * Helper function to "flatten" arrays of arrays into a single array. This method should be used as the callback
 * for a `Array.reduce`.
 *
 * @param accumulator - Accumulated array in a reduce
 * @param currentValue - The next array to be considered
 */
function flatten(accumulator, currentValue) {
    return [...accumulator, ...currentValue];
}
exports.flatten = flatten;
/**
 * Returns true if all elements in an array pass the callback truth test
 *
 * @param elements - the elements to be tested
 * @param callback - the callback function used as a test
 */
function every(elements, callback) {
    // return true if no false is found...
    const found = elements.find((element) => !callback(element));
    return found === undefined;
}
exports.every = every;
/** ******************************************************************* */
/*                       Conversion utility functions                   */
/** ******************************************************************* */
/**
 * Remove the 'preamble' from the line, ie, the part that is
 * put there by the IRC client. Unfortunately, that is not standard,
 * which means that each client does it differently.
 *
 * This function relies on a user option, if available; otherwise
 * it tries some heuristics among the currently known IRC logs formats:
 * RRSAgent (default), Textual, or IRCCloud. New formats can be added here as needed.
 *
 * The function has a side effect of setting the irc_format value in the configuration. This means
 * the right extra lines will be removed, if necessary (and the regexp will be matched only once)
 *
 * @param line - the full line of an IRC log
 * @return truncated line
 */
function remove_preamble(line, config) {
    const preamble_size = (the_line) => {
        if (config.irc_format) {
            switch (config.irc_format) {
                case 'irccloud': return types_1.Constants.irccloud_preamble_size;
                case 'textual': return types_1.Constants.textual_preamble_size;
                case 'rrsagent':
                default: return types_1.Constants.rrsagent_preamble_size;
            }
        }
        else if (the_line.match(types_1.Constants.irccloud_regexp) !== null) {
            config.irc_format = 'irccloud';
            return types_1.Constants.irccloud_preamble_size;
        }
        else if (the_line.match(types_1.Constants.textual_regexp) !== null) {
            config.irc_format = 'textual';
            return types_1.Constants.textual_preamble_size;
        }
        else {
            config.irc_format = 'rrsagent';
            return types_1.Constants.rrsagent_preamble_size;
        }
    };
    const preamble = preamble_size(line);
    return line.slice(preamble);
}
/**
 * Handle the 'scribejs' directives. The directives are of the form "scribejs, COMMAND ARGS" or, equivalently, "sjs, COMMAND ARGS".
 *
 * At the moment there are two possible directives:
 *
 * 1. `set`, adding a temporary nick name (by extending the global data on nicknames)
 * 2. `issue` or `pr`,  handling the issue/pr directives
 *
 * Note, however, that the second block (issue directives) are not really handled by this function; their handling is delayed to the local context where these directives appear.
 *
 * @param line_object - a line object; the only important entry is the 'content'
 * @returns true if the line is _not_ a scribejs directive (ie, the line should be kept), false otherwise. The function can therefore be used as part of an `Array.filter` call.
 */
function handle_scribejs(line_object, config) {
    if (line_object.content_lower.startsWith('scribejs, ') || line_object.content_lower.startsWith('sjs, ')) {
        // If there is a problem somewhere, it should simply be forgotten
        // these are all beautifying steps, ie, an exception could be ignored
        try {
            const words = line_object.content.split(' ');
            switch (words[1]) {
                case 'issue':
                case 'pr':
                    // these are handled elsewhere; the directives should stay in content for further processing
                    return true;
                // Set a per-session nickname.
                case 'set': {
                    const nickname = words[2].toLowerCase();
                    const name_comps = words.slice(3);
                    if (name_comps.length !== 0) {
                        // The name is cleared from the '_' signs, which
                        // are usually used to replace spaces...
                        config.nicks.push({
                            nick: [nickname],
                            name: name_comps.join(' ').replace(/_/g, ' '),
                        });
                    }
                    break;
                }
                default: {
                    return true;
                }
            }
        }
        catch (err) {
            return true;
        }
        // If we got there, the directive has its effect and should be removed
        // returning 'false' will remove this line from the result
        return false;
    }
    // This line should remain for further processing
    return true;
}
/**
 * Extract a labelled item, ie, something of the form "XXX: YYY", where
 * "XXX:" is the 'label'. "XXX" is always in lower case, and the content is
 * checked in lower case, too.
 *
 * @param label - the label we are looking for
 * @param line - a line object of the form {nick, content},
 * @returns  the content without the label, or null if that label is not present
 */
function get_labelled_item(label, line) {
    const lower = line.content.toLowerCase();
    const label_length = label.length + 1; // Accounting for the ':' character!
    return lower.startsWith(`${label}:`) === true ? line.content.slice(label_length).trim() : null;
}
/**
 * Get a 'label', ie, find out if there is a 'XXX:' at the beginning of a line.
 *
 * The function takes care of a frequent scribe error: the continuation line (starting with a '...' or an '…')
 * is sometimes preceded by a ':'. This is taken care of by returning the full line without the ':'.
 *
 * @param {string} line - one line of text
 * @returns {object} - {label, content}, containing the (possibly null)
 *     label, separated from the rest
 */
function get_label(line) {
    const reg = line.trim().match(/^(\w+):(.*)$/);
    if (reg === null) {
        return {
            label: null,
            content: line,
        };
    }
    const possible_label = reg[1].trim();
    const possible_content = reg[2].trim();
    // There are some funny cases, however...
    if (['http', 'https', 'email', 'ftp', 'doi'].includes(possible_label)) {
        // Ignore the label...
        return {
            label: null,
            content: line,
        };
    }
    if (possible_label === '...' || possible_label === '…') {
        // this seems to be a recurring error: scribe continuation lines are
        // preceded by "...:" instead of purely "..."
        return {
            label: null,
            content: `${possible_label} ${possible_content}`,
        };
    }
    return {
        label: possible_label,
        content: possible_content,
    };
}
exports.get_label = get_label;
/**
 * Create a "canonical" nickname, ie,
 *
 * * lower case
 * * free of additional characters used by (some) IRC servers, like adding a '@' character, or
 *   adding an '_' character to the start or the end of the nickname.
 *
 * @param nick - the original nickname
 * @param lower - whether the name should be put into lower case
 * @return the 'canonical' nickname
 */
function canonical_nick(nick, lower = true) {
    const to_canonicalize = lower ? nick.toLocaleLowerCase() : nick;
    return to_canonicalize.replace(/^_+/, '').replace(/_+$/, '').replace(/^@/, '');
}
exports.canonical_nick = canonical_nick;
/**
 * Extract a list of nick names (used for present, regrets, and guests, etc)
 * All of these have a common structure: 'XXX+' means add nicknames, 'XXX-' means remove
 * nicknames, 'XXX:' means set them.
 *
 * The function receives, as argument, a list containing the current list of those
 * categories, and performs a 'union' or 'difference' actions, resulting in an updated list
 *
 * @param current_list - the current list of nicknames
 * @param line - IRC line object
 * @param category - the 'label' to look for (ie, 'present', 'regrets', 'scribe', etc.)
 * @param remove - whether removal should indeed happen with a '-' suffix. A `false` value may make sense when the same irc line is reused twice: once to act upon it but without listing it and once when the list is collected for the header (e.g., scribe name extractions).
 * @returns  new value of the list of nicknames
 */
function get_name_list(current_list, line, category, remove = true) {
    // fake function, just to make the code below cleaner for the case when removal must be ignored
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arg1 = (a, b) => a;
    // Another fake function that only keeps the second argument, again to make the code cleaner
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arg2 = (a, b) => b;
    // Extract the (nick) names from the comma separated list of persons
    const get_names = (index) => {
        // Care should be taken to trim everything in order keep the nick names clean of extra spaces...
        const retval = line.content.slice(index + 1).trim().split(',');
        if (retval.length === 0 || (retval.length === 1 && retval[0].length === 0)) {
            return [line.nick];
        }
        return retval;
    };
    const lower = line.content_lower.trim();
    const cutIndex = category.length;
    if (lower.startsWith(category) === true) {
        // bingo, we have to extract the content
        // There are various possibilities, through
        let action = union;
        let names = [];
        // Note that, although the correct syntax is, e.g., "present+", a frequent
        // mistake is to type "present +". Same for the usage of '-'.
        // I decided to make the script resilient on this:-)
        if (lower.startsWith(`${category}+`) === true) {
            names = get_names(cutIndex);
        }
        else if (lower.startsWith(`${category} +`) === true) {
            names = get_names(cutIndex + 1);
        }
        else if (lower.startsWith(`${category}:`) === true) {
            names = get_names(cutIndex);
        }
        else if (lower.startsWith(`${category}-`) === true) {
            names = get_names(cutIndex);
            action = remove ? difference : arg1;
        }
        else if (lower.startsWith(`${category} -`) === true) {
            names = get_names(cutIndex + 1);
            action = remove ? difference : arg1;
        }
        else if (lower.startsWith(`${category}=`) === true) {
            names = get_names(cutIndex);
            action = arg2;
        }
        else if (lower.startsWith(`${category} =`) === true) {
            names = get_names(cutIndex + 2);
            action = arg2;
        }
        else {
            // This is not a correct usage...
            return undefined;
        }
        return action(current_list, names.map((name) => name.trim()));
    }
    else {
        return undefined;
    }
}
exports.get_name_list = get_name_list;
/**
 * Cleanup actions on the incoming body:
 *  - turn the body (which is one giant string) into an array of lines
 *  - remove empty lines
 *  - remove the starting time stamps
 *  - turn lines into objects, separating the nick name and the content
 *  - remove the lines coming from zakim or rrsagent
 *  - remove zakim queue commands
 *  - remove zakim agenda control commands
 *  - remove bot commands ("zakim,", "rrsagent,", etc.)
 *  - remove the "XXX has joined #YYY" type messages
 *  - handle the "scribejs, nick FULL NAME" type commands (or, equivalently, "sjs, nick ...")
 *
 *
 * @param body - the full IRC log
 * @returns array of {nick, content, content_lower} objects ('nick' is the IRC nick)
 */
// eslint-disable-next-line max-lines-per-function
function cleanup(body, config) {
    const cleaned_up_lines = body
        .filter((line) => line.length !== 0)
        // Remove the starting time stamp or equivalent. The function
        // relies on the fact that each line starts with a specific number of characters.
        // Alas!, this depends on the irc log format...
        .map((line) => remove_preamble(line, config))
        .filter((line) => {
        // this filter is, in fact, unnecessary if rrsagent is properly used
        // however, if the script is used against a line-oriented log
        // of an irc client (like textual) then this come handy in taking
        // out at least some of the problematic lines
        if (config.irc_format === undefined) {
            // use the default RRSAgent log, no extra filter is necessary
            return true;
        }
        switch (config.irc_format) {
            case 'textual': {
                const stripped_line = line.trim();
                return !(stripped_line.length === 0
                    || stripped_line[0] === '•'
                    || stripped_line.startsWith('Disconnected for Sleep Mode')
                    || stripped_line.includes('rrsagent')
                    || stripped_line.includes('zakim')
                    || stripped_line.includes('github-bot')
                    || stripped_line.includes('joined the channel')
                    || stripped_line.includes('------------- Begin Session -------------')
                    || stripped_line.includes('------------- End Session -------------')
                    || stripped_line.includes('changed the topic to'));
            }
            case 'irccloud': {
                const stripped_line = line.trim();
                return !(stripped_line.length === 0
                    || stripped_line[0] === '→'
                    || stripped_line[0] === '—'
                    || stripped_line[0] === '⇐');
            }
            default: {
                return true;
            }
        }
    });
    // IRC log lines are turned into objects, separating the nicknames.
    const line_objects = cleaned_up_lines.map((line) => {
        const sp = line.indexOf(' ');
        return {
            // Note that I remove the '<' and the '>' characters
            // leaving only the real nickname
            nick: line.slice(1, sp - 1),
            content: line.slice(sp + 1).trim(),
        };
    });
    // From here on, the lines are cleaned up using the line object
    return line_objects
        // Taking care of the accidental appearance of what could be
        // interpreted as an HTML tag...
        // Unless... the scribe or the commenter has already put the tag into back quotes!
        .map((line_object) => {
        line_object.content = line_object.content.replace(/([^`])<(\w*\/?)>([^`])/g, '$1`<$2>`$3');
        return line_object;
    })
        // Add a lower case version of the content to the objects; this will be used
        // for comparisons later
        .map((line_object) => {
        line_object.content_lower = line_object.content.toLowerCase();
        return line_object;
    })
        // Bunch of filters, removing the unnecessary lines
        .filter((line_object) => (line_object.nick !== 'RRSAgent'
        && line_object.nick !== 'Zakim'
        && line_object.nick !== 'github-bot'))
        .filter((line_object) => !(line_object.content_lower.startsWith('q+')
        || line_object.content_lower.startsWith('+q')
        || line_object.content_lower.startsWith('vq?')
        || line_object.content_lower.startsWith('qq+')
        || line_object.content_lower.startsWith('q-')
        || line_object.content_lower.startsWith('q?')
        || line_object.content_lower.startsWith('ack')
        || line_object.content_lower.startsWith('agenda+')
        || line_object.content_lower.startsWith('agenda?')
        || line_object.content_lower.startsWith('trackbot,')
        || line_object.content_lower.startsWith('zakim,')
        || line_object.content_lower.startsWith('rrsagent,')
        || line_object.content_lower.startsWith('github topic')
        || line_object.content_lower.startsWith('github-bot,')))
        // There are some irc messages that should be taken care of
        .filter((line_object) => !(line_object.content.match(/^\w+ has joined #\w+/)
        || line_object.content.match(/^\w+ has left #\w+/)
        || line_object.content.match(/^\w+ has changed the topic to:/)))
        // Handle the scribejs directives
        .filter((line) => handle_scribejs(line, config));
}
exports.cleanup = cleanup;
/**
 *  Fill in the header structure with
 *   - present: comma separated IRC nicknames
 *   - regrets: comma separated IRC nicknames
 *   - guests: comma separated IRC nicknames
 *   - chair: string
 *   - agenda: string
 *   - meeting: string
 *   - date: string
 *   - scribe: comma separated IRC nicknames
 * All these actions, except for 'scribe', also remove the corresponding
 * lines from the IRC log array.
 *
 * @param lines - array of {nick, content, content_lower} objects
 * @param date - date to be used in the header
 * @param cleanup_names - call back function to turn nicknames into real names
 * @returns  {header, lines}, where "header" is the header object, "lines" is the cleaned up IRC log
 */
// Beware: although using underscore functions, ie, very functional oriented style, the
// filters all have side effects in the sense of expanding the 'header structure'. Not
// very functional but, oh well...
function separate_header(lines, date) {
    const headers = {
        present: [],
        regrets: [],
        guests: [],
        chair: [],
        agenda: '',
        date: date || '',
        scribe: [],
        meeting: '',
    };
    /**
     * Extract a list of nick names (used for present, regrets, and guests)
     * All of these have a common structure: 'XXX+' means add nicknames, 'XXX-' means remove
     * nicknames, 'XXX:' means set them.
     * If found, the relevant field in the header object is extended.
     *
     * The real work is done in the [[get_name_list]] function; this utility just handles some usual mistakes
     * before calling out the real one:
     *
     * * usage of 'guest' instead of 'guests'
     * * usage of 'regret' instead of 'regrets'
     * * usage of 'scribenick' instead of 'scribe' (this is a historical remain…)
     *
     * @param category - the 'label' to look for
     * @param line - IRC line object
     * @param remove - whether removal should indeed happen with a '-' suffix
     * @returns true or false, depending on whether this is indeed a line with that category
     */
    const people = (category, line, remove = true) => {
        // A frequent scribing mistake is to use "guest" instead of "guests", or
        // "regret" instead of "regrets". Although the "official" documented
        // version is the plural form, I decided to make the script resilient...
        // Then there is also the duality of 'scribe' and 'scribenick',
        // inherited from scribe.pl...
        let real_category;
        switch (category) {
            case 'guest':
                real_category = 'guests';
                break;
            case 'regret':
                real_category = 'regrets';
                break;
            case 'scribenick':
                real_category = 'scribe';
                break;
            default:
                real_category = category;
        }
        const new_list = get_name_list(headers[real_category], line, category, remove);
        if (new_list === undefined) {
            return false;
        }
        else {
            headers[real_category] = new_list;
            return true;
        }
    };
    /**
     * Extract single items like "agenda:" or "meeting:"
     * If found, the relevant field in the header object is set.
     *
     * @param category - the 'label' to look for
     * @param line - IRC line object
     * @returns true or false, depending on whether this is indeed a line with that category
     */
    const single_item = (category, line) => {
        const item = get_labelled_item(category, line);
        if (item !== null) {
            headers[category] = item;
            return true;
        }
        return false;
    };
    // filter out all irc log lines that are related to header information
    // except for the scribe-related lines; while those should 'enrich' the headers,
    // the lines themselves should remain to control the final output
    const processed_lines = lines
        .filter((line) => !people('present', line))
        .filter((line) => !(people('regrets', line) || people('regret', line)))
        .filter((line) => !(people('guests', line) || people('guest', line)))
        .filter((line) => !people('chair', line))
        .filter((line) => {
        people('scribe', line, false);
        people('scribenick', line, false);
        return true;
    })
        .filter((line) => !single_item('agenda', line))
        .filter((line) => !single_item('meeting', line))
        .filter((line) => !single_item('date', line))
        .filter((line) => (line.nick !== 'trackbot'));
    return {
        headers: headers,
        lines: processed_lines,
    };
}
exports.separate_header = separate_header;
/**
 * Handle the i/../../ type lines, ie, insert new lines
 *
 * @param lines - array of {nick, content, content_lower} objects
 * @returns {array} - returns the lines with the possible changes done
 */
function perform_insert_requests(lines) {
    // This array will contain change request structures:
    // lineno: the line number of the change request
    // at, add: the insert values
    const insert_requests = [];
    // This is the method used to see if it is a change request.
    // Note that there are two possible syntaxes:
    //   i/.../.../
    //   i|...|...|
    const get_insert_request = (str) => str.match(/^i\/([^/]+)\/([^/]+)\/{0,1}/) || str.match(/^i\|([^|]+)\|([^|]+)\|{0,1}/);
    const marker = '----INSERTREQUESTXYZ----';
    const intermediate_retval = lines
        // Because the insert is to work on the preceding values, the
        // array has to be traversed upside down...
        .reverse()
        .map((line, index) => {
        // Find the insert requests, extract the values to a separate array
        // and place a marker to signal original request
        // (Adding new content right away is not a good idea, because things are based on
        // the array index later...)
        const r = get_insert_request(line.content);
        if (r !== null) {
            // store the regex results
            insert_requests.push({
                lineno: index,
                at: r[1],
                add: r[2],
                valid: true,
            });
            // This line has to be removed at some point later...
            line.content = marker;
        }
        return line;
    })
        .map((line, index) => {
        // See if a content has to be modified by one of the insert requests
        // Note that, temporarily, and array of Line Objects are returned, ie, the result of 'map' is
        // an array or arrays.
        if (line.content !== marker) {
            const insert_retval = [line];
            for (const insert of insert_requests) {
                if (insert.valid && index > insert.lineno && line.content.indexOf(insert.at) !== -1) {
                    // this request has played its role...
                    insert.valid = false;
                    // This is the real action: add a new structure, ie, a new line
                    // Note that it is added and not inserted; we are upside down and the order of the lines will be reversed later
                    insert_retval.push({
                        nick: line.nick,
                        content: insert.add,
                        content_lower: insert.add.toLowerCase(),
                    });
                    break; // we do not need to look at other request for this line
                }
            }
            return insert_retval;
        }
        else {
            // This is a placeholder of the original request, will be removed later.
            return [line];
        }
    });
    return intermediate_retval
        .reduce(flatten, [])
        // Remove the markers, just to be on the safe side
        .filter((line) => (line.content !== marker))
        // return the array into its original order
        .reverse();
}
exports.perform_insert_requests = perform_insert_requests;
/**
 * Handle the s/../.. type lines, ie, make changes on the contents
 *
 * @param {array} lines - array of {nick, content, content_lower} objects
 * @returns {array} - returns the lines with the possible changes done
 */
function perform_change_requests(lines) {
    // This array will contain change request structures:
    // lineno: the line number of the change request
    // from, to: the change values
    // g, G: booleans to signal whether these flag have been set
    // valid: boolean that signals that this request is still valid
    const change_requests = [];
    // This is the method used to see if it is a change request.
    // Note that there are two possible syntaxes:
    //   s/.../.../{gG}
    //   s|...|...|{gG}
    const get_change_request = (str) => str.match(/^s\/([^/]+)\/([^/]*)\/{0,1}(g|G){0,1}/) || str.match(/^s\|([^|]+)\|([^/|]*)\|{0,1}(g|G){0,1}/);
    const marker = '----CHANGEREQUESTXYZ----';
    const retval = lines
        // Because the change is to work on the preceding values, the
        // array has to be traversed upside down...
        .reverse()
        .map((line, index) => {
        // Find the change requests, extract the values to a separate array
        // and place a marker to remove the original request later
        // (Removing it right away is not a good idea, because things are based on
        // the array index later...)
        const r = get_change_request(line.content);
        if (r !== null) {
            // The 'from' in the change request is r[1]; this will be used in the form of a
            // regular expression. That is created here;
            try {
                change_requests.push({
                    lineno: index,
                    from: r[1],
                    to: r[2],
                    g: r[3] === 'g',
                    G: r[3] === 'G',
                    valid: true,
                    from_regexp: RegExp(r[1], 'g'),
                });
                line.content = marker;
            }
            catch (e) {
                console.error(`The change request for '${r[1]}' cannot be used as a regular expression.`);
            }
        }
        return line;
    })
        .map((line, index) => {
        // See if a line has to be modified by one of the change requests
        if (line.content !== marker) {
            for (const change of change_requests) {
                // One change request: the change should occur
                // - in any case if the 'G' flag is on
                // - if the index is beyond the change request position otherwise
                if (change.valid && (change.G || index >= change.lineno)) {
                    if (line.content.indexOf(change.from) !== -1) {
                        // There is a change to be performed. The conversion to regexp
                        // ensures that all occurrences of the 'from' pattern is exchanged
                        try {
                            line.content = line.content.replace(change.from_regexp, change.to);
                            // If this was not a form of 'global' change then its role is done
                            // and the request should be invalidated
                            if (!(change.G || change.g)) {
                                change.valid = false;
                            }
                        }
                        catch (e) {
                            console.error(`Error in handling change request with ${change.from}: ${e.message}. Change request ignored`);
                        }
                    }
                }
            }
        }
        return line;
    })
        // Remove the markers
        .filter((line) => (line.content !== marker))
        // return the array into its original order
        .reverse();
    return retval;
}
exports.perform_change_requests = perform_change_requests;
/**
* URL handling: find URL-s in a line and convert it into an active markdown link.
*
* There different possibilities:
* * `-> URL some text` as a separate line (a.k.a. Ralph style links); "some text" becomes the link text
* * `-> some text URL` anywhere in the line, possibly several patterns in a line; "some text" becomes the link text
* * Simple URL formatted text where the link text is the URL itself
*
* Links in markup syntax are left unchanged.
*
* @param {String} line - the line itself
* @returns {String} - the converted line
*/
function add_links(line) {
    /**
    * Rudimentary check whether the string should be considered a dereferencable URL
    */
    const check_url = (str) => {
        const a = url.parse(str);
        return a.protocol !== null && ['http:', 'https:', 'ftp:', 'mailto:', 'doi:'].indexOf(a.protocol) !== -1;
    };
    /**
     * Splitting the line into words. By default, one splits along a space character; however, markdown code
     * (i.e., anything between a pair pair of "`" characters) should be considered a single word.
     * @param {String} full_line - the content line
     * @returns {Array} - array of strings, ie, the words
     */
    const split_to_words = (full_line) => {
        const REPL_HACK = '$MD_CODE$';
        const regex = /`[^`]+`/g;
        const trimmed = full_line.trim();
        const codes = trimmed.match(regex);
        if (codes) {
            // ugly hack: replacing the code portions with a fixed pattern
            // now we can split to get words; each code portion appears a word with REPL_HACK
            let code_index = 0;
            const fake = trimmed.replace(regex, REPL_HACK);
            return fake.split(' ').filter((word) => word !== '').map((word) => {
                if (word.indexOf(REPL_HACK) !== -1) {
                    // eslint-disable-next-line no-plusplus
                    return word.replace(REPL_HACK, codes[code_index++]);
                }
                else {
                    return word;
                }
            });
        }
        else {
            // no codes to play with
            // empty words are also filtered out
            return trimmed.split(' ').filter((word) => word !== '');
        }
    };
    /**
    * Taking care of the case where only URL-s are in the line without a pattern: such words are found
    * and are converted into markup-style links with the URL text as a link text itself.
    */
    const simple_link_exchange = (word) => (check_url(word) ? `[${word}](${word})` : word);
    /**
     * Taking care of the `-> some text URL` pattern. The list of words is converted into a list of words with the
     * link portions turned into markup-style links. The '->' marker is dropped from the output.
     *
     * This is a recursive function to locate all pattern occurrences.
     *
     * @param {Array} list_of_words - the original string turned into a list of words
     * @return {Array} - the converted list of words
     */
    const replace_links = (list_of_words) => {
        if (list_of_words.length === 0)
            return list_of_words;
        const start = list_of_words.findIndex((word) => word === '->');
        if (start === -1) {
            // No links to worry about
            return list_of_words;
        }
        else {
            const preamble = list_of_words.slice(0, start);
            const rest = list_of_words.slice(start + 1);
            const link_index = rest.findIndex(check_url);
            if (link_index <= 0) {
                // the string '->' used for some other purposes
                return list_of_words;
            }
            else {
                const new_link_word = [`[${rest.slice(0, link_index).join(' ')}](${rest[link_index]})`];
                const so_far = [...preamble, ...new_link_word];
                if (link_index === rest.length) {
                    return so_far;
                }
                else {
                    const leftover = rest.slice(link_index + 1);
                    // recursion to get possible other links in the line
                    return [...so_far, ...replace_links(leftover)];
                }
            }
        }
    };
    // 1. separate the line into an array of words (double spaces must be filtered out...)
    const words = split_to_words(line);
    // The case when the first "word" is '->' followed by a URL and a text ("Ralph style links") should be treated separately
    if (words[0] === '->' && words.length >= 3 && check_url(words[1])) {
        const url_part = words[1];
        const link_part = words.slice(2).join(' ');
        return `See [${link_part}](${url_part}).`;
    }
    else {
        // Call out for the possible link constructs and then run the result through a simple converter to take of leftovers.
        return replace_links(words).map(simple_link_exchange).join(' ') + '.';
    }
}
exports.add_links = add_links;
//# sourceMappingURL=utils.js.map