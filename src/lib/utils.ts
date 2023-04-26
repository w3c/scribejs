/**
 *
 * Collection of utility functions, put here for a better maintenance
 *
 *
 * @packageDocumentation
 */

import { LineObject, Header, Configuration, Global }    from './types';
import { Constants }                                    from './types';
import { url_to_issue_directive }                       from './issues';
import { GitHub }                                       from './js/githubapi';
import * as url                                         from 'url';

/* ******************************************************************** */
/*                     Cached Github interfaces                         */
/* ******************************************************************** */
/** @internal */
interface GH_Cache {
    [key:string]: GitHub
}

export class GitHubCache {
    private static github_interfaces: GH_Cache = {};
    static gh(repo_id: string, config: Configuration): GitHub {
        if (GitHubCache.github_interfaces[repo_id] === undefined) {
            GitHubCache.github_interfaces[repo_id] = new GitHub(repo_id, config);
        }
        return GitHubCache.github_interfaces[repo_id];
    }
}

/** ******************************************************************* */
/*                           Generic utilities                          */
/** ******************************************************************* */

/** (Calculated) constant to decide whether the code runs in a browser or via node.js */
export const is_browser :boolean = (process === undefined || process.title === 'browser');

/** (Calculated) constant for today's date in ISO format */
export const today: string = new Date().toISOString().split('T')[0];

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
 * Union of two arrays ('union' in a set-theoretic sense, i.e., with no duplicates)
 * @param a
 * @param b
 */
export function union<T>(a: T[], b: T[]): T[] {
    const sa = new Set(a);
    for ( const entry of b ) {
        sa.add(entry)
    }
    return [...sa]
}

/**
 * Difference of two arrays ('difference' in a set-theoretic sense, i.e., generating `a \ b`)
 *
 * @param a
 * @param b
 */

export function difference<T>(a: T[], b: T[]): T[] {
    const sa = new Set(a);
    for ( const entry of b) {
        sa.delete(entry)
    }
    return [...sa]
}

/**
 * Helper function to "flatten" arrays of arrays into a single array. This method should be used as the callback
 * for a `Array.reduce`.
 *
 * @param accumulator - Accumulated array in a reduce
 * @param currentValue - The next array to be considered
 */
export function flatten<T>(accumulator: T[], currentValue: T[]): T[] {
    return [...accumulator, ...currentValue];
}

/**
 * Returns true if all elements in an array pass the callback truth test
 *
 * @param elements - the elements to be tested
 * @param callback - the callback function used as a test
 */
export function every<T>(elements: T[], callback: ((element: T) => boolean)): boolean {
    // return true if no false is found...
    const found = elements.find((element: T) => !callback(element));
    return found === undefined;
}

/** ******************************************************************* */
/*                       Conversion utility functions                   */
/** ******************************************************************* */

/**
 * Remove the 'preamble' from the line, ie, the part that is
 * put there by the IRC client. Unfortunately, that is not standard,
 * which means that each client adds a different preamble.
 *
 * This function relies on a user option for the IRC log format. If not available
 * it tries some heuristics among the currently known IRC logs formats:
 * RRSAgent (default), Textual, or IRCCloud. New formats can be added here as needed.
 *
 * The fallback, in all cases, is the RSSAgent format.
 *
 * The function has a side effect of setting the irc_format value in the configuration. This means
 * the right extra lines will be removed, if necessary (and the regexp will be matched only once)
 *
 * @param line - the full line of an IRC log
 * @return truncated line, ie, with preamble removed.
 */
function remove_preamble(line: string, config: Configuration): string {
    /**
     * Establish the size of the preamble to be removed; set the irc format in the config
     * in case that has not be set originally.
     *
     * @param the_line - The incoming IRC log line
     * @return the size of the preamble
     */
    const preamble_size = (the_line: string): number => {
        if (config.irc_format) {
            switch (config.irc_format) {
            case 'irccloud': return Constants.irccloud_preamble_size;
            case 'textual' : return Constants.textual_preamble_size;
            case 'rrsagent':
            default: return Constants.rrsagent_preamble_size;
            }
        } else if (the_line.match(Constants.irccloud_regexp) !== null) {
            config.irc_format = 'irccloud';
            return Constants.irccloud_preamble_size;
        } else if (the_line.match(Constants.textual_regexp) !== null) {
            config.irc_format = 'textual';
            return Constants.textual_preamble_size;
        } else {
            config.irc_format = 'rrsagent';
            return Constants.rrsagent_preamble_size;
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
 * This function is used as part of an `Array.filter` operation; i.e., the return value is a
 * boolean signaling whether the line should be kept or not. See the exact value of the boolean below.
 *
 * Note, however, that the second block (issue directives) are not really handled by this function; their handling is delayed to the local context where these directives appear.
 *
 * @param line_object - a line object; the only important entry is the 'content'
 * @returns true if the line is _not_ a global scribejs directive (ie, the line should be kept), false otherwise.
 */
function handle_scribejs(line_object: LineObject, config: Global): boolean {
    if (line_object.content_lower.startsWith('scribejs, ') || line_object.content_lower.startsWith('sjs, ')) {
        // If there is a problem somewhere, it should simply be forgotten
        // these are all beautifying steps, ie, an exception could be ignored
        try {
            const words = line_object.content.split(' ');
            switch (words[1]) {
            case 'issue':
            case 'pr':
                // these are handled elsewhere; the directives should stay in content for further processing
                // This switch branch is unnecessary, and left here for 'documentation' purposes only.
                return true;
            case 'set': {
                // Set a per-session nickname.
                const nickname   = words[2].toLowerCase();
                const name_comps = words.slice(3);
                if (name_comps.length !== 0) {
                    // The name is cleared from the '_' signs, which
                    // are usually used to replace spaces...
                    config.nicks.push({
                        nick : [nickname],
                        name : name_comps.join(' ').replace(/_/g, ' '),
                    });
                }
                break;
            }
            default: {
                return true;
            }
            }
        } catch (err) {
            return true;
        }
        // If we got there, the directive has its effect and should be removed
        // returning 'false' will remove this line from the overall result
        return false;
    }
    // This line should remain for further processing
    return true;
}


/**
 * Get a 'label', ie, find out if there is a 'XXX:' at the beginning of a line.
 *
 * The function takes care of a frequent scribe error: the continuation line (starting with a '...' or an '…')
 * is sometimes preceded by a ':'. This is taken care of by returning the full line without the ':'.
 *
 * Another frequent error is to put a space after the label but before the ':' character. This is also taken care of.
 *
 * @param {string} line - one line of text
 * @returns {object} - {label, content}, containing the (possibly null) label, separated from the rest
 */
export function get_label(line: string): {label: string, content: string} {
    const reg = line.trim().match(/^(\w+)[ ]{0,2}:(.*)$/);
    if (reg === null) {
        return {
            label   : null,
            content : line,
        };
    }

    const possible_label   = reg[1].trim();
    const possible_content = reg[2].trim();
    // There are some funny cases, however...
    if (['http', 'https', 'email', 'ftp', 'doi', 'did', 'data'].includes(possible_label)) {
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
 * Create a "canonical" nickname, ie,
 *
 * * lower case
 * * free of additional characters used by (some) IRC servers, like adding a '@' character, or adding an '_' character to the start or the end of the nickname.
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
 * The function receives, as argument, a list containing the current list of those
 * categories, and performs a 'union' or 'difference' actions, resulting in an updated list
 *
 * @param current_list - the current list of nicknames
 * @param line - IRC line object
 * @param category - the 'label' to look for (ie, 'present', 'regrets', 'scribe', etc.)
 * @param remove - whether removal should indeed happen with a '-' suffix. A `false` value may make sense when the same irc line is reused for two different purposes: list the name in the header but also act on its presence in the minutes. Scribe setting is the typical case: the effect of `scribe-` should result of removing the name from the header report
 *
 * @returns  new value of the list of nicknames
 */
export function get_name_list(current_list: string[], line: LineObject, category :string, remove = true): string[] {
    // fake function, just to make the code below cleaner for the case when removal must be ignored
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arg1 = (a: any, b: any): any => a;

    // Another fake function that only keeps the second argument, again to make the code cleaner
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arg2 = (a: any, b: any): any => b;

    // Extract the (nick) names from the comma separated list of persons
    // 'number' is the number of characters that must be ignored, corresponding to the category
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
        // bingo, we have to extract the content.
        // There are various possibilities, through...
        let action :(a: any, b:any) => any = union; // This is the default action on the nicknames
        let names :string[]  = [];
        // Note that, although the correct syntax is, e.g., "present+", a frequent
        // mistake is to type "present +". Same for the usage of '-'.
        // The script resilient on this:-)
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
        return action(current_list, names.map((name: string) => name.trim()));
    } else {
        return undefined;
    }
}


/**
 * Cleanup actions on the incoming irc log (ie, an array of lines):
 *
 *  - remove empty lines
 *  - remove the irc preamble (time stamp, typically)
 *  - turn lines into objects, separating the nick name and the content
 *  - remove the lines coming from zakim, rrsagent, and possibly other bots
 *  - remove zakim queue commands
 *  - remove zakim agenda control commands
 *  - remove bot commands ("zakim,", "rrsagent,", etc.)
 *  - remove the "XXX has joined #YYY" type messages
 *  - handle the "scribejs, nick FULL NAME" type commands (or, equivalently, "sjs, nick ...")
 *
 *
 * @param minutes - the full IRC log
 * @returns array of {nick, content, content_lower} objects ('nick' is the IRC nick)
 */
// eslint-disable-next-line max-lines-per-function
export function cleanup(minutes: string[], config: Global): LineObject[] {
    // Cleanup action on the log lines
    const cleaned_up_lines: string[]  = minutes
        // remove the empty lines
        .filter((line: string): boolean => line.length !== 0)

        // Remove the starting time stamp or equivalent. The function
        // relies on the fact that each line starts with a specific number of characters.
        // This depends on the irc log format...
        .map((line: string) => remove_preamble(line, config))

        // remove possible IRC format specific lines
        .filter((line: string): boolean => {
            // this filter is, in fact, unnecessary if rrsagent is used
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
                return !(
                    stripped_line.length === 0
                    || stripped_line[0] === '•'
                    || stripped_line.startsWith('Disconnected for Sleep Mode')
                    || stripped_line.includes('rrsagent')
                    || stripped_line.includes('zakim')
                    || stripped_line.includes('github-bot')
                    || stripped_line.includes('agendabot')
                    || stripped_line.includes('joined the channel')
                    || stripped_line.includes('------------- Begin Session -------------')
                    || stripped_line.includes('------------- End Session -------------')
                    || stripped_line.includes('changed the topic to')
                );
            } case 'irccloud': {
                const stripped_line = line.trim();
                return !(
                    stripped_line.length === 0
                    || stripped_line[0] === '→'
                    || stripped_line[0] === '—'
                    || stripped_line[0] === '⇐'
                    || stripped_line[0] === '←'
                );
            }
            default: {
                return true;
            }}
        });

    // IRC log lines are turned into objects, separating the nicknames. From now on, the minutes
    // is an array of special objects.
    const line_objects: LineObject[] = cleaned_up_lines.map((line: string): LineObject => {
        const sp = line.indexOf(' ');
        return {
            // Note that I remove the '<' and the '>' characters
            // leaving only the real nickname
            nick    : line.slice(1, sp - 1),
            content : line.slice(sp + 1).trim(),
        };
    });
    // Filtering on the line objects now
    return line_objects
        // Taking care of the accidental appearance of what could be
        // interpreted as an HTML tag...
        // Unless... the scribe or the commenter has already put the tag into back quotes!
        .map((line_object: LineObject): LineObject => {
            line_object.content = line_object.content.replace(/([^`])<(\w*\/?)>([^`])/g, '$1`<$2>`$3');
            return line_object;
        })

        // Agenda handling: the agendum display should be converted into a bona fide topic
        .map((line_object: LineObject): LineObject => {
            if ((line_object.nick === 'Zakim' || line_object.nick === 'zakim') && line_object.content.startsWith('agendum')) {
                // The "real" agenda item is surrounded by a '--' string.
                try {
                    const topic = line_object.content.match(Constants.agenda_regexp);
                    line_object.content = `Topic: ${topic[1]}`;
                    // Replacing the nickname; it should not remain "zakim" because that is removed later;
                    // because it is a topic line, the nickname will not appear in the output
                    line_object.nick = 'scribejs';
                } catch (error) {
                    // the agendum prefix can also appear for other commands which may lead to an exception here...
                    // just finish the stuff
                }
            }
            return line_object;
        })

        // convert issue/PR URL-s into scribejs directives to handle issues and PRs, if
        // appropriate
        .map((line_object: LineObject): LineObject => {
            return {
                nick    : line_object.nick,
                content : url_to_issue_directive(line_object.content),
            }
        })

        // Add a lower case version of the content to the objects; this will be used
        // for comparisons later
        .map((line_object: LineObject): LineObject => {
            line_object.content_lower = line_object.content.toLowerCase();
            return line_object;
        })

        // Bunch of filters, removing the unnecessary lines
        .filter((line_object: LineObject): boolean => (
            line_object.nick !== 'RRSAgent'
            && line_object.nick !== 'Zakim'
            && line_object.nick !== 'github-bot'
            && line_object.nick !== 'agendabot'
            && line_object.nick !== 'trackbot'
        ))
        .filter((line_object: LineObject): boolean => !(
            line_object.content_lower.startsWith('q+')
            || line_object.content_lower.startsWith('+q')
            || line_object.content_lower.startsWith('vq?')
            || line_object.content_lower.startsWith('qq+')
            || line_object.content_lower.startsWith('q-')
            || line_object.content_lower.startsWith('q?')
            || line_object.content_lower.startsWith('q ')
            || line_object.content_lower === 'q'
            || line_object.content_lower.startsWith('ack')
            || line_object.content_lower.startsWith('agenda+')
            || line_object.content_lower.startsWith('agenda?')
            || line_object.content_lower.startsWith('trackbot,')
            || line_object.content_lower.startsWith('zakim,')
            || line_object.content_lower.startsWith('rrsagent,')
            || line_object.content_lower.startsWith('github topic')
            || line_object.content_lower.startsWith('github-bot,')
        ))
        // There are some irc messages that should be taken care of
        .filter((line_object: LineObject): boolean => !(
            line_object.content.match(/^\w+ has joined #\w+/)
            || line_object.content.match(/^\w+ has left #\w+/)
            || line_object.content.match(/^\w+ has changed the topic to:/)
        ))
        // Handle the scribejs directives which **may** lead to the removal of that line from the minutes
        .filter((line: LineObject): boolean => handle_scribejs(line, config));
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
 * All these actions, except for 'scribe', also remove the corresponding lines from the IRC log array.
 *
 * @param lines - array of {nick, content, content_lower} objects
 * @param date - date to be used in the header
 * @returns {header, lines}, where "header" is the header object, "lines" is the rest of the IRC log, with header specific lines removed
 */
export function separate_header(lines: LineObject[], date: string): {headers: Header, lines: LineObject[]} {
    const headers: Header = {
        present : [],
        regrets : [],
        guests  : [],
        chair   : [],
        agenda  : '',
        date    : date || '',
        scribe  : [],
        meeting : '',
    };

    /**
     * Extract a list of nick names (used for present, regrets, and guests)
     * All of these have a common structure: 'XXX+' means add nicknames, 'XXX-' means remove
     * nicknames, 'XXX:' means set them.
     * If found, the relevant field in the header object is extended.
     *
     * The real work is done in the [[get_name_list]] function; this wrapper utility just handles some usual mistakes
     * before calling out the real one:
     *
     * * usage of 'guest' instead of 'guests'
     * * usage of 'regret' instead of 'regrets'
     * * usage of 'scribenick' instead of 'scribe' (this is a historical remain…)
     *
     * This method is used in filter, hence its return type.
     *
     * @param category - the 'label' to look for
     * @param line - IRC line object
     * @param remove - whether removal should indeed happen with a '-' suffix
     * @returns true or false, depending on whether this is indeed a line with that category.
     */
    const people = (category: string, line: LineObject, remove = true): boolean => {
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
        case 'chairs':
            real_category = 'chair';
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
        /**
         * Extract a labelled item, ie, something of the form "XXX: YYY", where
         * "XXX:" is the 'label'. "XXX" is always in lower case, and the content is
         * checked in lower case, too.
         */
        const get_labelled_item = (label: string): string => {
            const lower = line.content.toLowerCase();
            const label_length = label.length + 1; // Accounting for the ':' character!
            return lower.startsWith(`${label}:`) === true ? line.content.slice(label_length).trim() : null;
        }
        const item = get_labelled_item(category);
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
        .filter((line) => !(people('chairs', line) || people('chair', line)))
        .filter((line) => {
            people('scribe', line, false);
            people('scribenick', line, false);
            return true;
        })
        .filter((line) => !single_item('agenda', line))
        .filter((line) => !single_item('meeting', line))
        .filter((line) => !single_item('date', line))
        ;

    return {
        headers : headers,
        lines   : processed_lines,
    };
}


/**
 * Handle the i/../../ type lines, ie, insert new lines
 *
 * @param lines - array of {nick, content, content_lower} objects
 * @returns {array} - returns the lines with the possible changes done
 */
export function perform_insert_requests(lines: LineObject[]): LineObject[] {
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
        // Because the insert is to work on the *preceding* values, the processing with indexes is simpler if the
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
                    lineno : index,
                    at     : r[1],
                    add    : r[2],
                    valid  : true,
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
                const insert_retval: LineObject[] = [line];
                for (const insert of insert_requests) {
                    if (insert.valid && index > insert.lineno && line.content.indexOf(insert.at) !== -1) {
                        // this request has played its role...
                        insert.valid = false;
                        // This is the real action: add a new structure, ie, a new line
                        // Note that it is added and not inserted; we are upside down and the order of the lines will be reversed later
                        insert_retval.push({
                            nick          : line.nick,
                            content       : insert.add,
                            content_lower : insert.add.toLowerCase(),
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
export function perform_change_requests(lines: LineObject[]): LineObject[] {
    // Interestingly, node.js does not have the replaceAll function, although defined for Javascript... oh well...
    const replaceAll = (inp: string, from: string, to: string): string => {
        // Node, until version 15, has not implemented the string.replaceAll() function. This had to be done by hand...
        return inp.split(from).join(to);
    }

    interface ChangeRequest {
        lineno: number;
        valid: boolean;
        from: string;
        to: string;
        g: boolean;
        G: boolean;
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
    const error_marker       = '----ERRORINREQUESTXYZ----';

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
                // The 'from' in the change request is r[1]; this will be used in the form of a
                // regular expression. That is created here;
                change_requests.push({
                    lineno : index,
                    from   : r[1],
                    to     : r[2],
                    g      : r[3] === 'g',
                    G      : r[3] === 'G',
                    valid  : true,
                });
                line.content = marker;
            }
            return line;
        })
        .map((line, index) => {
            // See if a line has to be modified by one of the change requests
            if (line.content !== marker && line.content !== error_marker) {
                for (const change of change_requests) {
                    // One change request: the change should occur
                    // - in any case if the 'G' flag is on
                    // - if the index is beyond the change request position otherwise
                    if (change.valid && (change.G || index >= change.lineno)) {
                        if (line.content.indexOf(change.from) !== -1) {
                            // There is a change to be performed.
                            try {
                                line.content = replaceAll(line.content, change.from, change.to);
                                // If this was not a form of 'global' change then its role is done
                                // and the request should be invalidated
                                if (!(change.G || change.g)) {
                                    change.valid = false;
                                }
                            } catch (e) {
                                console.error(`Error in handling change request with ${change.from}: ${e.message}. Change request ignored`);
                            }
                        }
                    }
                }
            }
            return line;
        })
        // Remove the markers
        .filter((line) => (line.content !== marker && line.content !== error_marker))
        // return the array into its original order
        .reverse();

    return retval;
}


/**
 * Splitting a line into words. By default, one splits along a space character; however, markdown code
 * (i.e., anything between a pair pair of "`" characters) should be considered a single word.
 * @param {String} full_line - the content line
 * @returns {Array} - array of strings, ie, the words
 */
export function split_to_words(full_line: string): string[] {
    const trimmed = full_line.trim();
    const REPL_HACK = '$MD_CODE$';
    const code_regex = /`[^`]+`/g;
    const codes = trimmed.match(code_regex);

    if (codes) {
        // ugly hack: replacing the code portions with a fixed pattern
        // then we can split to get words; each code portion appears a word with REPL_HACK
        let code_index = 0;
        const fake = trimmed.replace(code_regex, REPL_HACK);
        return fake.split(' ').filter((word) => word !== '').map((word) => {
            if (word.indexOf(REPL_HACK) !== -1) {
                // eslint-disable-next-line no-plusplus
                return word.replace(REPL_HACK, codes[code_index++]);
            } else {
                return word;
            }
        });
    } else {
        // no codes to play with
        // empty words are also filtered out
        return trimmed.split(' ').filter((word) => word !== '');
    }
}


/**
* Rudimentary check whether the string should be considered a dereferencable URL
*/
export function check_url(str: string): boolean {
    const a = url.parse(str);
    return a.protocol !== null && Constants.protocols.indexOf(a.protocol) !== -1;
}


// The case when the first "word" is '->' followed by a URL and a text ("Ralph style links") should be treated separately

/**
* URL handling: find URL-s in a line and convert it into an active markdown link.
*
* There are different possibilities:
* * `-> URL some text` as a separate line (a.k.a. Ralph style links); "some text" becomes the link text
* * `-> some text URL` anywhere in the line, possibly several patterns in a line; "some text" becomes the link text
* * Simple URL formatted text where the link text is the URL itself
*
* Links in markup syntax are left unchanged.
*
* @param {String} line - the line itself
* @returns {String} - the converted line
*/
export function add_links(line: string): string {

    /**
     * Convert (if applicable) a "Ralph style link", i.e., a '->' followed by a URL and a text, into a structure
     * with the link data part and a url_part
     */
    const ralph_style_links = (words: string[]): {link_part: string, url_part: string} => {
        if ((words[0] === '->' || words[0] === '-->') && words.length >= 3 && check_url(words[1])) {
            const url_part = words[1];
            const link_part = words.slice(2).join(' ');
            return {link_part, url_part};
        } else {
            return {
                link_part : words.join(' '),
                url_part  : undefined,
            }
        }
    }

    /**
    * Taking care of the case where only URL-s are in the line without a pattern: such words are found
    * and are converted into markup-style links with the URL text as a link text itself.
    */
    const simple_link_exchange = (word: string): string => (check_url(word) ? `[${word}](${word})` : word);

    /**
     * Taking care of the `-> some text URL` pattern. The list of words is converted into a list of words with the
     * link portions turned into markup-style links. The '->' marker is dropped from the output.
     *
     * This is a recursive function to locate all pattern occurrences.
     *
     * @param {Array} list_of_words - the original string turned into a list of words
     * @return {Array} - the converted list of words
     */
    const replace_links = (list_of_words: string[]): string[] => {
        if (list_of_words.length === 0) return list_of_words;

        const start = list_of_words.findIndex((word) => (word === '->' || word === '-->'));
        if (start === -1) {
            // No links to worry about
            return list_of_words;
        } else {
            const preamble = list_of_words.slice(0, start);
            const rest = list_of_words.slice(start + 1);
            const link_index = rest.findIndex(check_url);
            if (link_index <= 0) {
                // the string '->' used for some other purposes
                return list_of_words;
            } else {
                const new_link_word = [`See [${rest.slice(0, link_index).join(' ')}](${rest[link_index]})`];
                const so_far = [...preamble, ...new_link_word];
                if (link_index === rest.length) {
                    return so_far;
                } else {
                    const leftover = rest.slice(link_index + 1);
                    // recursion to get possible other links in the line
                    return [...so_far, ...replace_links(leftover)];
                }
            }
        }
    };

    // 1. separate the line into an array of words (double spaces must be filtered out...)
    const words = split_to_words(line);

    // The case when the first "word" is '->' followed by a URL and a text ("Ralph style links") it should be treated separately
    const {link_part, url_part} = ralph_style_links(words);
    if (url_part !== undefined) {
        return `See [${link_part}](${url_part}).`
    } else {
        // Call out for the possible link constructs and then run the result through a simple converter to take of leftovers.
        const final_text = replace_links(words).map(simple_link_exchange).join(' ');
        return final_text.match(/[.!?]$/) === null ? final_text + '.' : final_text;
    }
}
