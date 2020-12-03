/**
 *
 * Collection of utility functions, put here for a better maintenance
 *
 *
 * For the moment, the default (ie, 'master') branch is used.
 *
 * @packageDocumentation
 */

import { LineObject, Header } from './types';
const safe = require('safe-regex');

/** ******************************************************************* */
/*                       Conversion generic utilities                   */
/** ******************************************************************* */

/** constant to decide whether the code runs in a browser or via node.js */
export const is_browser :boolean = (process === undefined || process.title === 'browser');

/**
 * "Zip" two arrays, i.e., create an array whose elements are pairs of the corresponding elements in the two arrays being processed.
 */
export function zip<T,U>(left: T[], right: U[]): [T,U][] {
    const l = (left.length <= right.length) ? left.length : right.length;
    const retval: [T,U][] = [];
    for (let i = 0; i < l; i++) {
        retval.push([left[i],right[i]])
    }
    return retval;
}

/**
 * Remove duplicates from an array
 */
export function uniq<T>(inp: T[]): T[] {
    return [...new Set(inp)];
}

/**
 * Union of two arrays ('union' in a set-theoretic sense, ie, no duplicates)
 * @param a
 * @param b
 */
export function union<T>(a: T[], b: T[]): T[] {
    let sa = new Set(a);
    for( let entry of b ) {
        sa.add(entry)
    }
    return [...sa]
}

/**
 * Difference of two arrays ('difference' in a set-theoretic sense, ie, `a \ b`)
 * @param a
 * @param b
 */

export function difference<T>(a: T[], b: T[]): T[] {
    let sa = new Set(a);
    for( let entry of b) {
        sa.delete(entry)
    }
    return [...sa]
}

/**
 * Helper function to "flatten" arrays of arrays into a single array. This method should be used as the callback
 * for a `reduce`.
 *
 * @param accumulator - Accumulated array in a reduce
 * @param currentValue - The next array to be considered
 */
export function flatten<T>(accumulator: T[], currentValue: T[]): T[] {
    return [...accumulator, ...currentValue];
}


/** ******************************************************************* */
/*                       Conversion utility functions                   */
/** ******************************************************************* */

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
export function get_label(line: string): {label: string, content: string} {
    const reg = line.trim().match(/^(\w+):(.*)$/);
    if (reg === null) {
        return {
            label   : null,
            content : line,
        };
    }

    const possible_label   = reg[1].trim();
    const possible_content = reg[2].trim();
    // There are some funny cases, however...
    if (['http', 'https', 'email', 'ftp', 'doi'].includes(possible_label)) {
        // Ignore the label...
        return {
            label   : null,
            content : line,
        };
    }

    if (possible_label === '...' || possible_label === '…') {
        // this seems to be a recurring error: scribe continuation lines are
        // preceded by "...:" instead of purely "..."
        return {
            label   : null,
            content : `${possible_label} ${possible_content}`,
        };
    }

    return {
        label   : possible_label,
        content : possible_content,
    };
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
export function get_labelled_item(label: string, line: LineObject): string {
    const lower = line.content.toLowerCase();
    const label_length = label.length + 1; // Accounting for the ':' character!
    return lower.startsWith(`${label}:`) === true ? line.content.slice(label_length).trim() : null;
}


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
export function canonical_nick(nick: string, lower = true): string {
    const to_canonicalize = lower ? nick.toLocaleLowerCase() : nick;
    return to_canonicalize.replace(/^_+/, '').replace(/_+$/, '').replace(/^@/, '');
}


/**
 * Extract a list of nick names (used for present, regrets, and guests, etc)
 * All of these have a common structure: 'XXX+' means add nicknames, 'XXX-' means remove
 * nicknames, 'XXX:' means set them.
 *
 * The function receives, as argument, a list containing the 'current' list of those
 * categories, and performs a 'union' or 'difference' actions, resulting in an updated list
 *
 * @param current_list - the current list of nicknames
 * @param line - IRC line object
 * @param category - the 'label' to look for (ie, 'present', 'regrets', 'scribe', etc.)
 * @param remove - whether removal should indeed happen with a '-' suffix
 * @returns  new value of the list of nicknames
 */
export function get_name_list(current_list: string[], line: LineObject, category :string, remove = true): string[] {
    // fake function, just to make the code below cleaner for the case when removal must be ignored
    // eslint-disable-next-line no-unused-vars
    const arg1 = (a: any, b: any): any => a;

    // Another fake function that only keeps the second argument, again to make the code cleaner
    // eslint-disable-next-line no-unused-vars
    const arg2 = (a: any, b: any): any => b;

    // Extract the (nick) names from the comma separated list of persons
    const get_names = (index: number): string[] => {
        // Care should be taken to trim everything in order keep the nick names clean of extra spaces...
        const retval = line.content.slice(index + 1).trim().split(',');
        if (retval.length === 0 || (retval.length === 1 && retval[0].length === 0)) {
            return [line.nick];
        }
        return retval;
    };

    const lower    = line.content_lower.trim();
    const cutIndex = category.length;

    if (lower.startsWith(category) === true) {
        // bingo, we have to extract the content
        // There are various possibilities, through
        let action = union;
        let names  = [];
        // Note that, although the correct syntax is, e.g., "present+", a frequent
        // mistake is to type "present +". Same for the usage of '-'.
        // I decided to make the script resilient on this:-)
        if (lower.startsWith(`${category}+`) === true) {
            names = get_names(cutIndex);
        } else if (lower.startsWith(`${category} +`) === true) {
            names = get_names(cutIndex + 1);
        } else if (lower.startsWith(`${category}:`) === true) {
            names = get_names(cutIndex);
        } else if (lower.startsWith(`${category}-`) === true) {
            names = get_names(cutIndex);
            action = remove ? difference : arg1;
        } else if (lower.startsWith(`${category} -`) === true) {
            names = get_names(cutIndex + 1);
            action = remove ? difference : arg1;
        } else if (lower.startsWith(`${category}=`) === true) {
            names = get_names(cutIndex);
            action = arg2;
        } else if (lower.startsWith(`${category} =`) === true) {
            names = get_names(cutIndex + 2);
            action = arg2;
        } else {
            // This is not a correct usage...
            return undefined;
        }
        return action(current_list,  names.map((name: string) => name.trim()));
    } else {
        return undefined;
    }
}


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
export function separate_header(lines: LineObject[], date: string, cleanup_names: (names: string[]) => string[]): {headers: Header, lines: LineObject[]} {
    const headers: Header = {
        present : [],
        regrets : [],
        guests  : [],
        chair   : [],
        agenda  : '',
        date    : date || '',
        scribe  : [],
        meeting : ''
    };

    /**
     * Extract a list of nick names (used for present, regrets, and guests)
     * All of these have a common structure: 'XXX+' means add nicknames, 'XXX-' means remove
     * nicknames, 'XXX:' means set them.
     * If found, the relevant field in the header object is extended.
     *
     * The real work is done in the `get_name_list` method; this utility just handles some usual mistakes
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
    const people = (category: string, line: LineObject, remove = true): boolean => {
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
        } else {
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
    const single_item = (category: string, line: LineObject): boolean => {
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

    // Cleaning up the names in the header
    for (let key in headers) {
        if (Array.isArray(headers[key])) {
            headers[key] = cleanup_names(headers[key]);
        }
    }

    return {
        headers: headers,
        lines: processed_lines
    };
}


/**
 * Handle the i/../../ type lines, ie, insert new lines
 *
 * @param lines - array of {nick, content, content_lower} objects
 * @returns {array} - returns the lines with the possible changes done
 */
export function perform_insert(lines: LineObject[]): LineObject[] {
    interface InsertRequest {
        lineno: number;
        valid: boolean;
        add: string;
        at: string;
    }

    // This array will contain change request structures:
    // lineno: the line number of the change request
    // at, add: the insert values
    const insert_requests: InsertRequest[] = [];

    // This is the method used to see if it is a change request.
    // Note that there are two possible syntaxes:
    //   i/.../.../
    //   i|...|...|
    const get_insert_request = (str: string) => str.match(/^i\/([^/]+)\/([^/]+)\/{0,1}/) || str.match(/^i\|([^|]+)\|([^|]+)\|{0,1}/);
    const marker             = '----INSERTREQUESTXYZ----';

    const intermediate_retval: (LineObject[])[] = lines
        // Because the insert is to work on the preceding values, the
        // array has to be traversed upside down...
        .reverse()
        .map((line: LineObject, index: number) => {
            // Find the insert requests, extract the values to a separate array
            // and place a marker to signal original request
            // (Adding new content right away is not a good idea, because things are based on
            // the array index later...)
            const r = get_insert_request(line.content);
            if (r !== null) {
                // store the regex results
                insert_requests.push({
                    lineno   : index,
                    at       : r[1],
                    add      : r[2],
                    valid    : true,
                });
                // This line has to be removed at some point later...
                line.content = marker;
            }
            return line;
        })
        .map((line: LineObject, index: number): LineObject[] => {
            // See if a content has to be modified by one of the insert requests
            // Note that, temporarily, and array of Line Objects are returned, ie, the result of 'map' is
            // an array or arrays.
            if (line.content !== marker) {
                let insert_retval: LineObject[] = [line];
                for (const insert of insert_requests) {
                    if (insert.valid && index > insert.lineno && line.content.indexOf(insert.at) !== -1) {
                        // this request has played its role...
                        insert.valid = false;
                        // This is the real action: add a new structure, ie, a new line
                        // Note that it is added and not inserted; we are upside down and the order of the lines will be reversed later
                        insert_retval.push({
                            nick          : line.nick,
                            content       : insert.add,
                            content_lower : insert.add.toLowerCase()
                        });
                        break; // we do not need to look at other request for this line
                    }
                }
                return insert_retval;
            } else {
                // This is a placeholder of the original request, will be removed later.
                return [line];
            }
        });

        return intermediate_retval
            .reduce(flatten,[])
            // Remove the markers, just to be on the safe side
            .filter((line) => (line.content !== marker))
            // return the array into its original order
            .reverse();
}

/**
 * Handle the s/../.. type lines, ie, make changes on the contents
 *
 * @param {array} lines - array of {nick, content, content_lower} objects
 * @returns {array} - returns the lines with the possible changes done
 */
export function perform_changes(lines: LineObject[]): LineObject[] {
    interface ChangeRequest {
        lineno: number;
        valid:  boolean;
        from:   string;
        to:     string;
        g:      boolean;
        G:      boolean;
    }
    // This array will contain change request structures:
    // lineno: the line number of the change request
    // from, to: the change values
    // g, G: booleans to signal whether these flag have been set
    // valid: boolean that signals that this request is still valid
    const change_requests: ChangeRequest[] = [];

    // This is the method used to see if it is a change request.
    // Note that there are two possible syntaxes:
    //   s/.../.../{gG}
    //   s|...|...|{gG}
    const get_change_request = (str: string) => str.match(/^s\/([^/]+)\/([^/]*)\/{0,1}(g|G){0,1}/) || str.match(/^s\|([^|]+)\|([^/|]*)\|{0,1}(g|G){0,1}/);
    const marker             = '----CHANGEREQUESTXYZ----';

    const retval = lines
        // Because the change is to work on the preceding values, the
        // array has to be traversed upside down...
        .reverse()
        .map((line: LineObject, index: number): LineObject => {
            // Find the change requests, extract the values to a separate array
            // and place a marker to remove the original request later
            // (Removing it right away is not a good idea, because things are based on
            // the array index later...)
            const r = get_change_request(line.content);
            if (r !== null) {
                // Check whether the 'from' field is 'safe', ie, it does
                // not create RegExp Denial of Service attack
                if (safe(r[1])) {
                    change_requests.push({
                        lineno : index,
                        from   : r[1],
                        to     : r[2],
                        g      : r[3] === 'g',
                        G      : r[3] === 'G',
                        valid  : true,
                    });
                }
                line.content = marker;
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
                            line.content = line.content.replace(RegExp(change.from, 'g'), change.to);
                            // line.content = line.content.replace(change.from, change.to);
                            // If this was not a form of 'global' change then its role is done
                            // and the request should be invalidated
                            if (!(change.G || change.g)) {
                                change.valid = false;
                            }
                        }
                    }
                };
            }
            return line;
        })
        // Remove the markers
        .filter((line) => (line.content !== marker))
        // return the array into its original order
        .reverse();

    return retval;
}
