/* eslint-disable no-else-return */

'use strict';

const _      = require('underscore');
const url    = require('url');
const safe   = require('safe-regex');
const issues = require('./issues');
const { schema_data } = require('./jsonld_header');

const JEKYLL_NONE     = 'none';
const JEKYLL_KRAMDOWN = 'kd';

const rrsagent_preamble_size = 8 + 1;
// const rrsagent_regexp = /^[0-9]{2}:[0-9]{2}:[0-9]{2}/;

const irccloud_preamble_size = 1 + 10 + 1 + 8 + 1 + 1;
const irccloud_regexp = /^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\]/;

const textual_preamble_size  = 1 + 10 + 1 + 8 + 1 + 4 + 1 + 1;
const textual_regexp  = /^\[[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{4}\]/;

const issue_regexp = /^@?(scribejs|sjs),\s+(issue|pr)\s+(.*)$/;

/**
 * Conversion of an RRS output into markdown. This is the real "meat" of the whole library...
 *
 * @param {string} body - the IRC log
 * @param {Array of Objects} config - the configuration file
 * @param {action_list} - the class handling actions
 * @returns {string} - the minutes in markdown
 */
exports.to_markdown = (body, config, action_list) => {
    const kramdown = config.jekyll === JEKYLL_KRAMDOWN;

    /** ******************************************************************* */
    /*                        Helper functions                              */
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
     * @param {string} line - the full line of an IRC log
     * @return {string} - truncated line
     */
    function remove_preamble(line) {
        const preamble_size = (the_line) => {
            if (config.irc_format) {
                switch (config.irc_format) {
                    case 'irccloud': return irccloud_preamble_size;
                    case 'textual': return textual_preamble_size;
                    case 'rrsagent':
                    default: return rrsagent_preamble_size;
                }
            } else if (the_line.match(irccloud_regexp) !== null) {
                config.irc_format = 'irccloud';
                return irccloud_preamble_size;
            } else if (the_line.match(textual_regexp) !== null) {
                config.irc_format = 'textual';
                return textual_preamble_size;
            } else {
                config.irc_format = 'rrsagent';
                return rrsagent_preamble_size;
            }
        };
        const preamble = preamble_size(line);
        return line.slice(preamble);
    }


    /**
     * Get a 'label', ie, find out if there is a 'XXX:' at the beginning of a line
     *
     * @param {string} line - one line of text
     * @returns {object} - {label, content}, containing the (possibly null)
     *     label, separated from the rest
     */
    function get_label(line) {
        const reg = line.trim().match(/^(\w+):(.*)$/);
        if (reg === null) {
            return {
                label   : null,
                content : line
            };
        }

        const possible_label   = reg[1].trim();
        const possible_content = reg[2].trim();
        // There are some funny cases, however...
        if (['http', 'https', 'email', 'ftp', 'doi'].includes(possible_label)) {
            // Ignore the label...
            return {
                label   : null,
                content : line
            };
        }
        if (possible_label === '...') {
            // this seems to be a recurring error: scribe continuation lines are
            // preceded by "...:" instead of purely "...""
            return {
                label   : null,
                content : `... ${possible_content}`
            };
        }

        return {
            label   : possible_label,
            content : possible_content
        };
    }


    /**
     * Create a "canonical" nickname, ie,
     *
     * * lower case
     * * free of additional characters used by (some) IRC servers, like adding a '@' character, or
     *   adding an '_' character to the start or the end of the nickname.
     *
     * @param {string} nick - the original nickname
     * @param {boolean} lower - whether the name should be put into lower case
     * @return {string} - the 'canonical' nickname
     */
    function canonical_nick(nick, lower = true) {
        const to_canonicalize = lower ? nick.toLocaleLowerCase() : nick;
        return to_canonicalize.replace(/^_+/, '').replace(/_+$/, '').replace(/^@/, '');
    }


    /**
     * Get a name structure for a nickname. This relies on the (optional) nickname list that
     * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
     * The configuration structure is also extended to include the nicknames, so that
     * the same full names can be used throughout the minutes.
     *
     * @param {string} nick - name/nickname
     * @returns {object} - `name` for the full name and `url`/`github` if available
     */
    function get_name(nick) {
        /**
         * Get the nickname mapping structure, if any, for a nickname.
         * Usage of a nickname mapping is really just a beautification step, so if there is
         * a problem in that structure, it should simply ignore it.
         *
         * @param {string} nick - name/nickname
         * @returns {object} the object for the nickname or null if not found
         */
        const nick_mapping = (the_nick) => {
            try {
                // eslint-disable-next-line no-restricted-syntax
                for (const struct of config.nicks) {
                    if (_.indexOf(struct.nick, the_nick) !== -1) {
                        // bingo, the right structure has been found:
                        return struct;
                    }
                }
            } catch (e) {
                return null;
            }
            // If we got here, there isn't any structure defined for this nickname
            return null;
        };

        // IRC clients tend to add a '_' to a usual nickname when there
        // are duplicate logins. Then there are the special users, denoted with a '@'.
        // Remove those.
        const clean_nick = canonical_nick(nick);

        // if this nickname has been used before, just return it
        if (config.nick_mappings[clean_nick]) {
            return config.nick_mappings[clean_nick];
        }

        const struct = nick_mapping(clean_nick);
        if (struct) {
            config.nick_mappings[clean_nick] = { name: struct.name };
            if (struct.url) config.nick_mappings[clean_nick].url = struct.url;
            if (struct.github) config.nick_mappings[clean_nick].github = struct.github;

            return config.nick_mappings[clean_nick];
        // eslint-disable-next-line no-else-return
        } else {
            // As a minimal measure, remove the '_' characters from the name
            // (many people use this to signal their presence when using, e.g., present+)
            // Note that this case usually occurs when one time visitors make a `present+ Abc_Def` to appear
            // in the present list; that is why the nick cleanup should not include a lower case conversion.
            return {
                nick : [clean_nick],
                name : canonical_nick(nick, false).replace(/_/g, ' ')
            };
        }
    }


    /**
      * Cleanup a name. This relies on the (optional) nickname list that
      * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
      * The configuration structure is also extended to include the nicknames, so that
      * the same full names can be used throughout the minutes.
      *
      * @param {string} nick - name/nickname
      * @returns {string} - cleaned up name
      */
    function cleanup_name(nick) {
        return get_name(nick).name;
    }


    /**
      * Provide with the github name for a nickname. This relies on the (optional) nickname list that
      * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
      *
      * @param {string} nick - name/nickname
      * @returns {string} - cleaned up name
      */
    function github_name(nick) {
        return get_name(nick).github;
    }


    /**
     * Cleanup the header/guest/regret/chair entries. This relies on the
     * (optional) nickname list that the user may provide, and replaces the
     * (sometimes cryptic) nicknames with real names. The configuration
     * structure is also extended to include the nicknames, so that the same
     * full names can be used throughout the minutes.
     *
     * This method is used for the header lists; it also creates a link for the
     * name, if available.
     *
     * @param {array} nicks - list of names/nicknames
     * @returns {array} - list of cleaned up names
     *
     */
    function cleanup_names(nicks) {
        return _.chain(nicks)
            .map(get_name)
            .map((obj) => (obj.url ? `[${obj.name}](${obj.url})` : obj.name))
            .uniq()
            .value();
    }


    /**
     * Extract a labelled item, ie, something of the form "XXX: YYY", where
     * "XXX:" is the 'label'. "XXX" is always in lower case, and the content is
     * checked in lower case, too.
     *
     * @param {string} label - the label we are looking for
     * @param {object} line - a line object of the form {nick, content},
     * @returns {string} - the content without the label, or null if that label is not present
     */
    function get_labelled_item(label, line) {
        const lower = line.content.toLowerCase();
        const label_length = label.length + 1; // Accounting for the ':' character!
        return lower.startsWith(`${label}:`) === true ? line.content.slice(label_length).trim() : null;
    }


    /**
     * Handle the 'scribejs' directives. The directives are of the form "scribejs, COMMAND ARGS" or, equivalently, "sjs, COMMAND ARGS".
     *
     * At the moment, the only directive is 'set', adding a temporary nick name
     * to the ones coming from the nickname file
     *
     * @param {object} line_object - a line object; the only important entry is the 'content'
     * @returns {boolean} - true if the line is _not_ a scribejs directive
     *     (ie, the line should be kept), false otherwise
     */
    function handle_scribejs(line_object) {
        if (line_object.content_lower.startsWith('scribejs,') || line_object.content_lower.startsWith('sjs,')) {
            // If there is a problem somewhere, it should simply be forgotten
            // these are all beautifying steps, ie, an exception could be ignored
            try {
                const words = line_object.content.split(' ');
                switch (words[1]) {
                    // Set a per-session nickname.
                    case 'issue':
                    case 'pr':
                        // these are handled elsewhere; the directives should stay in content for further processing
                        return true;
                    case 'set': {
                        const nickname   = words[2].toLowerCase();
                        const name_comps = words.slice(3);
                        if (name_comps.length !== 0) {
                            // The name is cleared from the '_' signs, which
                            // are usually used to replace spaces...
                            config.nicks.push({
                                nick : [nickname],
                                name : name_comps.join(' ').replace(/_/g, ' ')
                            });
                        }
                        break;
                    }
                    default: {
                        // do nothing; keep going
                    }
                }
            } catch (err) {
                // console.log(err)
            }
            // returning 'false' will remove this line from the result
            return false;
        }
        // This line should remain for further processing
        return true;
    }


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
     * The incoming body is either a single string with many lines (this is the
     * case when the script is invoked from the command line) or already split
     * into individual lines (this is the case when the data comes via the CGI interface).
     *
     * @param {string} body - the full IRC log
     * @returns {array} - array of {nick, content, content_lower} objects ('nick' is the IRC nick)
     */
    function cleanup(body_to_clean) {
        const split_body = _.isArray(body_to_clean)
            ? body_to_clean
            : body_to_clean.split(/\n/);

        // (the chaining feature of underscore is really helpful here...)
        // @ts-ignore
        return _.chain(split_body)
            .filter((line) => (_.size(line) !== 0))
            // Remove the starting time stamp or equivalent. The function
            // relies on the fact that each line starts with a specific number of characters.
            // Alas!, this depends on the irc log format...
            .map(remove_preamble)
            .filter((line) => {
                // these filters are, in fact, unnecessary if rrsagent is properly used
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
                        );
                    }
                    default: {
                        return true;
                    }
                }
            })
            // This is where the IRC log lines are turned into objects, separating the nicknames.
            .map((line) => {
                const sp = line.indexOf(' ');
                return {
                    // Note that I remove the '<' and the '>' characters
                    // leaving only the real nickname
                    nick    : line.slice(1, sp - 1),
                    content : line.slice(sp + 1).trim()
                };
            })
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
                // @ts-ignore
                line_object.content_lower = line_object.content.toLowerCase();
                return line_object;
            })
            // Bunch of filters, removing the unnecessary lines
            .filter((line_object) => (
                line_object.nick !== 'RRSAgent'
                && line_object.nick !== 'Zakim'
                && line_object.nick !== 'github-bot'
            ))
            .filter((line_object) => !(
                // @ts-ignore
                line_object.content_lower.startsWith('q+')
                // @ts-ignore
                || line_object.content_lower.startsWith('+q')
                // @ts-ignore
                || line_object.content_lower.startsWith('vq?')
                // @ts-ignore
                || line_object.content_lower.startsWith('qq+')
                // @ts-ignore
                || line_object.content_lower.startsWith('q-')
                // @ts-ignore
                || line_object.content_lower.startsWith('q?')
                // @ts-ignore
                || line_object.content_lower.startsWith('ack')
                // @ts-ignore
                || line_object.content_lower.startsWith('agenda+')
                // @ts-ignore
                || line_object.content_lower.startsWith('agenda?')
                // @ts-ignore
                || line_object.content_lower.startsWith('trackbot,')
                // @ts-ignore
                || line_object.content_lower.startsWith('zakim,')
                // @ts-ignore
                || line_object.content_lower.startsWith('rrsagent,')
                // @ts-ignore
                || line_object.content_lower.startsWith('github topic')
                // @ts-ignore
                || line_object.content_lower.startsWith('github-bot,')
            ))
            // There are some irc messages that should be taken care of
            .filter((line_object) => !(
                line_object.content.match(/^\w+ has joined #\w+/)
                || line_object.content.match(/^\w+ has left #\w+/)
                || line_object.content.match(/^\w+ has changed the topic to:/)
            ))
            // Handle the scribejs directives
            .filter(handle_scribejs)
            // End of the underscore chain, retrieve the final value
            .value();
    }


    /**
     * Extract a list of nick names (used for present, regrets, and guests, etc)
     * All of these have a common structure: 'XXX+' means add nicknames, 'XXX-' means remove
     * nicknames, 'XXX:' means set them.
     *
     * The function receives, as argument, a list containing the 'current' list of those
     * categories, and performs a 'union' or 'difference' actions, resulting in an updated list
     *
     * @param {Array of string} current_list - the current list of nicknames
     * @param {string} category - the 'label' to look for (ie, 'present', 'regrets', 'scribe', etc.)
     * @param {object} line - IRC line object
     * @param {boolean} remove - whether removal should indeed happen with a '-' suffix
     * @returns {Array of string} - new value of the list of nicknames
     */
    function get_name_list(current_list, line, category, remove = true) {
        // fake function, just to make the code below cleaner for the case when removal must be ignored
        // eslint-disable-next-line no-unused-vars
        // @ts-ignore
        const arg1 = (a, b) => a;

        // Another fake function that only keeps the second argument, again to make the code cleaner
        // eslint-disable-next-line no-unused-vars
        // @ts-ignore
        const arg2 = (a, b) => b;

        const get_names = (index) => {
            // Care should be taken to trim everything, to keep the nick names clean of extra spaces...
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
            let action = _.union;
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
                action = remove ? _.difference : arg1;
            } else if (lower.startsWith(`${category} -`) === true) {
                names = get_names(cutIndex + 1);
                action = remove ? _.difference : arg1;
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
            return action(current_list, _.map(names, (name) => name.trim()));
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
     * @param {array} lines - array of {nick, content, content_lower} objects
     *     ('nick' is the IRC nick)
     * @returns {object} - {header, lines}, where "header" is the header object,
     *     "lines" is the cleaned up IRC log
     */
    // Beware: although using underscore functions, ie, very functional oriented style, the
    // filters all have side effects in the sense of expanding the 'header structure'. Not
    // very functional but, oh well...
    function set_header(lines) {
        const headers = {
            present : [],
            regrets : [],
            guests  : [],
            chair   : [],
            agenda  : '',
            date    : config.date ? config.date : '',
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
         * @param {string} category - the 'label' to look for
         * @param {object} line - IRC line object
         * @param {boolean} remove - whether removal should indeed happen with a '-' suffix
         * @returns {boolean} - true or false, depending on whether this is indeed a line with that category
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
            } else {
                headers[real_category] = new_list;
                return true;
            }
        };


        /**
         * Extract single items like "agenda:" or "meeting:"
         * If found, the relevant field in the header object is set.
         *
         * @param {string} category - the 'label' to look for
         * @param {object} line - IRC line object
         * @returns {boolean} - true or false, depending on whether this is indeed a line with that category
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
        // except for the scribe-related lines; those should 'enrich' the headers, but
        // the lines themselves should remain to control the final output
        const processed_lines = _.chain(lines)
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
            .filter((line) => (line.nick !== 'trackbot'))
            .value();
        return {
            headers: _.mapObject(headers, (val) => {
                if (_.isArray(val)) {
                    return cleanup_names(val).join(', ');
                }
                return val;
            }),
            lines: processed_lines
        };
    }


    /**
     * Handle the i/../../ type lines, ie, insert new lines
     *
     * @param {array} lines - array of {nick, content, content_lower} objects
     *     ('nick' is the IRC nick)
     * @returns {array} - returns the lines with the possible changes done
     */
    function perform_insert(lines) {
        // This array will contain change request structures:
        // lineno: the line number of the change request
        // at, add: the insert values
        const insert_requests    = [];

        // This is the method used to see if it is a change request.
        // Note that there are two possible syntaxes:
        //   i/.../.../
        //   i|...|...|
        const get_insert_request = (str) => str.match(/^i\/([^/]+)\/([^/]+)\/{0,1}/) || str.match(/^i\|([^|]+)\|([^|]+)\|{0,1}/);
        const marker           = '----INSERTREQUESTXYZ----';

        const retval = _.chain(lines)
            // Because the insert is to work on the preceding values, the
            // array has to be traversed upside down...
            .reverse()
            .map((line, index) => {
                // Find the insert requests, extract the values to a separate array
                // and place a marker to remove the original request
                // (Removing it right away is not a good idea, because things are based on
                // the array index later...)
                const r = get_insert_request(line.content);
                if (r !== null) {
                    // store the regex results
                    insert_requests.push({
                        lineno : index,
                        at     : r[1],
                        add    : r[2],
                        valid  : true
                    });
                    line.content = marker;
                }
                return line;
            })
            .map((line, index) => {
                // See if a content has to be modified by one of the insert requests
                if (line.content !== marker) {
                    let map_retval = line;
                    for (let i = 0; i < insert_requests.length; i++) {
                        const insert = insert_requests[i];
                        if (insert.valid && index > insert.lineno
                            && line.content.indexOf(insert.at) !== -1) {
                            // this request has played its role...
                            insert.valid = false;
                            // This is the real action: add a new structure, ie, a new line
                            const new_line = {
                                nick          : line.nick,
                                content       : insert.add,
                                content_lower : insert.add.toLowerCase()
                            };
                            map_retval = [line, new_line];
                            break; // we do not need to look at other request for this line
                        }
                    }
                    return map_retval;
                }
                return line;
            })
            // Flatten, ie, what was added as an array of two lines should now transformed
            // into simple entries
            .flatten(true)
            // Remove the markers
            .filter((line) => (line.content !== marker))
            // return the array into its original order
            .reverse()
            // done:-)
            .value();

        return retval;
    }


    /**
     * Handle the s/../.. type lines, ie, make changes on the contents
     *
     * @param {array} lines - array of {nick, content, content_lower} objects
     *     ('nick' is the IRC nick)
     * @returns {array} - returns the lines with the possible changes done
     */
    function perform_changes(lines) {
        // This array will contain change request structures:
        // lineno: the line number of the change request
        // from, to: the change values
        // g, G: booleans to signal whether these flag have been set
        // valid: boolean that signals that this request is still valid
        const change_requests    = [];

        // This is the method used to see if it is a change request.
        // Note that there are two possible syntaxes:
        //   s/.../.../{gG}
        //   s|...|...|{gG}
        const get_change_request = (str) => str.match(/^s\/([^/]+)\/([^/]*)\/{0,1}(g|G){0,1}/) || str.match(/^s\|([^|]+)\|([^/|]*)\|{0,1}(g|G){0,1}/);
        const marker             = '----CHANGEREQUESTXYZ----';

        const retval = _.chain(lines)
            // Because the change is to work on the preceding values, the
            // array has to be traversed upside down...
            .reverse()
            .map((line, index) => {
                // Find the change requests, extract the values to a separate array
                // and place a marker to remove the original request
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
                            valid  : true
                        });
                        line.content = marker;
                    }
                }
                return line;
            })
            .map((line, index) => {
                // See if a line has to be modified by one of the change requests
                if (line.content !== marker) {
                    _.forEach(change_requests, (change) => {
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
                    });
                }
                return line;
            })
            // Remove the markers
            .filter((line) => (line.content !== marker))
            // return the array into its original order
            .reverse()
            // done:-)
            .value();

        // console.log(change_requests)
        return retval;
    }


    /**
     * Generate the Header part of the minutes: present, guests, regrets, chair, etc.
     *
     * Returns a string with the (markdown encoded) version of the header.
     *
     * @param {object} headers - the full header structure
     * @returns {string} - the header in Markdown
     */
    function generate_header_md(headers) {
        let header_start = '';
        if (config.jekyll !== JEKYLL_NONE) {
            const json_ld = schema_data(headers, config);
            header_start = `---
layout: minutes
date: ${headers.date}
title: ${headers.meeting} — ${headers.date}
json-ld: |
${json_ld}
---
`;
        } else if (config.pandoc) {
            // TODO: can jekyll and pandoc be used together?
            // ...could use some refactoring for clarity
            header_start = `% ${headers.meeting} — ${headers.date}

![W3C Logo](https://www.w3.org/Icons/w3c_home)

`;
        } else {
            header_start = '![W3C Logo](https://www.w3.org/Icons/w3c_home)\n';
        }

        let header_class = '';
        if (kramdown) {
            header_class = (config.final === true || config.auto === false) ? '{: .no_toc}' : '{: .no_toc .draft_notice_needed}';
        } else {
            header_class = '';
        }
        const no_toc = (kramdown) ? '{: .no_toc}' : '';

        const core_header = `
# ${headers.meeting} — Minutes
${header_class}
${config.final === true || config.auto === true ? '' : '***– DRAFT Minutes –***'}
${(config.final === true || config.auto === true) && kramdown ? '' : '{: .draft_notice}'}

**Date:** ${headers.date}

See also the [Agenda](${headers.agenda}) and the [IRC Log](${config.orig_irc_log})

## Attendees
${no_toc}
**Present:** ${headers.present}

**Regrets:** ${headers.regrets}

**Guests:** ${headers.guests}

**Chair:** ${headers.chair}

**Scribe(s):** ${headers.scribe}
`;
        return header_start + core_header;
    }


    /**
     * Generate the real content. This is the real core of the conversion...
     *
     * The function returns a string containing the (markdown version of) the minutes.
     *
     * Following traditions
     *  - the lines that are not written by the scribe are rendered differently (as a quote)
     *  - lines beginning with a "..." or a "…" are considered as "continuation
     *    lines" by the scribe; these are combined into a paragraph
     *  - "Topic:" and "Subtopic:" produce section headers, and a corresponding
     *    TOC is also generated
     *
     * @param {array} lines - array of {nick, content, content_lower} objects
     *     ('nick' is the IRC nick)
     * @returns {string} - the body of the minutes encoded in Markdown
     */
    function generate_content_md(lines) {
        // this will be the output
        let content_md     = '\n---\n';
        // this will be the table of contents
        let TOC        = '\n## Content:\n';
        const jekyll_toc = '\n## Content:\n{: .no_toc}\n\n* TOC\n{:toc}';
        // this will be the list or resolutions
        let resolutions = '';
        // this will be the list or actions
        let actions = '';

        /**
        * Table of content handling: a (Sub)topic's is set a label as well as a
        * reference into a table of content structure that grows as we go.
        * Sections (and the TOC entries) are automatically numbered
        */
        let sec_number_level_1 = 0;
        let sec_number_level_2 = 0;
        let numbering          = '';
        let header_level       = '';
        let toc_spaces         = '';

        const add_toc = (content, level) => {
            // Remove the markdown-style links
            const de_link = (line) => {
                // eslint-disable-next-line no-useless-escape
                const regex_link = /\[([^\[]+)\]\([^\(]+\)/g;
                return line.replace(regex_link, '$1');
            };

            // Alas! Links in titles do not work; otherwise the generated TOC would contain link texts with links...
            const bare_content = de_link(content);

            // id is used to set the @id value for the section header. For some
            // reasons, the '.' is not accepted at least by jekyll for a proper
            // TOC, so the '-' must be used.
            let id = '';
            if (level === 1) {
                sec_number_level_1 += 1;
                // @ts-ignore
                numbering = sec_number_level_1;
                sec_number_level_2 = 0;
                header_level = '### ';
                toc_spaces = '';
                id = `section${sec_number_level_1}`;
            } else {
                sec_number_level_2 += 1;
                numbering = `${sec_number_level_1}.${sec_number_level_2}`;
                header_level = '#### ';
                toc_spaces = '    ';
                id = `section${sec_number_level_1}-${sec_number_level_2}`;
            }
            if (kramdown) {
                content_md = content_md.concat('\n\n', `${header_level}${numbering}. ${bare_content}\n{: #${id}}`);
                TOC = TOC.concat(`${toc_spaces}* [${numbering}. ${bare_content}](#${id})\n`);
            } else {
                const auto_id = `${numbering}-${bare_content.toLowerCase().replace(/ /g, '-')}`;
                content_md = content_md.concat('\n\n', `${header_level}${numbering}. ${bare_content}`);
                TOC = TOC.concat(`${toc_spaces}* [${numbering}. ${bare_content}](#${auto_id})\n`);
            }
        };

        /**
        * Resolution handling: the resolution receives an ID, and a list of
        * resolution is repeated at the end
        */
        let rcounter = 1;
        const add_resolution = (content) => {
            const id = `resolution${rcounter}`;
            if (kramdown) {
                content_md = content_md.concat(`\n\n> ***Resolution #${rcounter}: ${content}***\n{: #${id} .resolution}`);
                resolutions = resolutions.concat(`\n* [Resolution #${rcounter}](#${id}): ${content}`);
            } else {
                content_md = content_md.concat(`\n\n> ***Resolution #${rcounter}: ${content}***`);
                // GFM and CommonMark do not support anchor creation...so we can't link to the resolutions T_T
                resolutions = resolutions.concat(`\n* Resolution #${rcounter}: ${content}`);
            }
            rcounter += 1;
        };

        /**
        * Action handling: the action receives an ID, and a list of actions is repeated at the end
        */
        let acounter = 1;
        const add_action = (content) => {
            const words = content.trim().split(' ');
            if (words[1] === 'to') {
                const ghname = github_name(words[0]);
                const name = cleanup_name(words[0]);
                const message = words.slice(2).join(' ');
                const final_content = `${message} (${name})`;
                const id = `action${acounter}`;
                if (kramdown) {
                    content_md = content_md.concat(`\n\n> ***Action #${acounter}: ${final_content}***\n{: #${id} .action}`);
                    actions = actions.concat(`\n* [Action #${acounter}](#${id}): ${final_content}`);
                } else {
                    content_md = content_md.concat(`\n\n> ***Action #${acounter}: ${final_content}***`);
                    // GFM and CommonMark do not support anchor creation...so we can't link to the actions T_T
                    actions = actions.concat(`\n* Action #${acounter}: ${final_content}`);
                }
                acounter += 1;

                // ------
                // Store the actions, if the separate action list handler is available
                // add_action(name, action, id)
                if (action_list !== undefined) {
                    action_list.add_action(`${id}`, message, name, ghname);
                }
            } else {
                console.log(`Warning: incorrect action syntax used: ${words}`);
            }
        };

        /**
        * URL handling: find URL-s in a line and convert it into an active markdown link.
        *
        * There different possibilities:
        * * `-> URL some text` as a separate line (a.k.a. Ralph style links); "some text" becomes the link text
        * * `-> some text URL` anywhere in the line, possibly several patterns in a line; "some text" becomes the link text
        * * Simple URL formatted text where the link text is the URL itself
        *
        * Markup syntaxed link are left unchanged.
        *
        * @param {String} line - the line itself
        * @returns {String} - the converted line
        */
        const add_links = (line) => {
            /**
            * Rudimentary check whether the string should be considered a dereferencable URL
            */
            const check_url = (str) => {
                const a = url.parse(str);
                return a.protocol !== null && ['http:', 'https:', 'ftp:', 'mailto:', 'doi:'].indexOf(a.protocol) !== -1;
            };

            /**
             * Splitting the line into words. By default, one splits along a space character; however, markdown code
             * (i.e., anything between a pair pf "`" characters) should be considered a single word.
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
                        } else {
                            return word;
                        }
                    });
                } else {
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
                if (list_of_words.length === 0) return list_of_words;

                const start = list_of_words.findIndex((word) => word === '->');
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
                        const new_link_word = [`[${rest.slice(0, link_index).join(' ')}](${rest[link_index]})`];
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

            // The case when the first "word" is '->' followed by a URL and a text ("Ralph style links") should be treated separately
            if (words[0] === '->' && words.length >= 3 && check_url(words[1])) {
                const url_part = words[1];
                const link_part = words.slice(2).join(' ');
                return `See [${link_part}](${url_part})`;
            } else {
                // Call out for the possible link constructs and then run the result through a simple converter to take of leftovers.
                return replace_links(words).map(simple_link_exchange).join(' ');
            }
        };


        // "state" variables for the main cycle...
        let scribes                = [];
        let within_scribed_content = false;
        let current_person         = '';

        // The main cycle on the content
        _.forEach(lines, (line_object) => {
            // This is declared here to use an assignment in a conditional below...
            let issue_match;

            // What is done depends on some context...
            // Do we have a new scribe?
            const new_scribe_list = get_name_list(scribes, line_object, 'scribe') || get_name_list(scribes, line_object, 'scribenick');
            if (new_scribe_list) {
                scribes = new_scribe_list.map((person) => canonical_nick(person));
                // this line can be forgotten...
                return;
            }

            // Add links, and separate the label from the rest
            const content_with_links = add_links(line_object.content);
            const { label, content } = get_label(content_with_links);

            // First handle special entries that must be handled regardless
            // of whether it was typed in by the scribe or not.
            if (label !== null && label.toLowerCase() === 'topic') {
                within_scribed_content = false;
                const title_structure = issues.titles(config, content);
                add_toc(title_structure.title_text, 1);
                if (title_structure.issue_reference !== '') {
                    content_md = content_md.concat(title_structure.issue_reference);
                }
            } else if (label !== null && label.toLowerCase() === 'subtopic') {
                within_scribed_content = false;
                const title_structure = issues.titles(config, content);
                add_toc(title_structure.title_text, 2);
                if (title_structure.issue_reference !== '') {
                    content_md = content_md.concat(title_structure.issue_reference);
                }
            } else if (label !== null && ['proposed', 'proposal', 'propose'].includes(label.toLowerCase())) {
                within_scribed_content = false;
                content_md = content_md.concat(
                    `\n\n> **Proposed resolution: ${content}** *(${cleanup_name(line_object.nick)})*`
                );
                if (kramdown) {
                    content_md = content_md.concat('\n{: .proposed_resolution}');
                }
            } else if (label !== null && label.toLowerCase() === 'summary') {
                within_scribed_content = false;
                content_md = content_md.concat(`\n\n> **Summary: ${content}** *(${cleanup_name(line_object.nick)})*`);
                if (kramdown) {
                    content_md = content_md.concat('\n{: .summary}');
                }
            } else if (label !== null && ['resolved', 'resolution'].includes(label.toLowerCase())) {
                within_scribed_content = false;
                add_resolution(content);
            } else if (label !== null && label.toLowerCase() === 'action') {
                within_scribed_content = false;
                add_action(content);
            // eslint-disable-next-line no-cond-assign
            } else if ((issue_match = content.match(issue_regexp)) !== null) {
                within_scribed_content = false;
                const directive        = issue_match[2];
                const issue_references = issue_match[3];
                content_md = content_md.concat(issues.issue_directives(config, directive, issue_references));
            } else if (scribes.includes(canonical_nick(line_object.nick))) {
                // This is a line produced one of the 'registered' scribes
                if (label !== null) {
                    // A new person is talking...
                    // Note the two spaces at the end of the line, this
                    // ensure line breaks within the paragraph!
                    // But... maybe this is not a new person after all! (Scribes, sometimes, forget about the usage of '...')
                    if (within_scribed_content && cleanup_name(label) === cleanup_name(current_person)) {
                        // Just mimic the continuation line:
                        content_md = content_md.concat(`\n… ${content}  `);
                    } else {
                        content_md = content_md.concat(`\n\n**${cleanup_name(label)}:** ${content}  `);
                        current_person = label;
                        within_scribed_content = true;
                    }
                } else {
                    // eslint-disable-next-line no-nested-ternary
                    const dots = content.startsWith('...') ? 3 : (content.startsWith('…') ? 1 : 0);

                    if (dots > 0) {
                        let new_content = content.slice(dots).trim();
                        if (new_content && new_content[0] === ':') {
                            // This is a relatively frequent scribe error,
                            // ie, to write "...:" as a continuation
                            new_content = new_content.slice(1);
                        }
                        // This is a continuation line
                        if (within_scribed_content) {
                            // We are in the middle of a full paragraph for
                            // one person, safe to simply add the text to
                            // the previous line without any further ado
                            content_md = content_md.concat('\n… ', new_content, '  ');
                        } else {
                            // For some reasons, there was a previous line
                            // that interrupted the normal flow, a new
                            // paragraph should be started
                            content_md = content_md.concat(`\n\n**${cleanup_name(current_person)}:** ${new_content}  `);
                            // content_md = content_md.concat("\n\n", content.slice(dots))
                            within_scribed_content = true;
                        }
                    } else {
                        // It is the scribe talking. Except if the scribe
                        // forgot to put the "...", but we cannot really
                        // help that:-(
                        within_scribed_content = false;

                        // This is a fall back: somebody (not the scribe) makes a note on IRC
                        content_md = content_md.concat(`\n\n> *${cleanup_name(line_object.nick)}:* ${content_with_links}`);
                    }
                }
            } else {
                // This is a fall back: somebody (not the scribe) makes a note on IRC
                within_scribed_content = false;
                content_md = content_md.concat(`\n\n> *${cleanup_name(line_object.nick)}:* ${content_with_links}`);
            }
        });

        // Endgame: pulling the TOC, the real minutes and, possibly, the
        // resolutions and actions together
        content_md = content_md.concat('\n\n---\n');

        if (rcounter > 1) {
            // There has been at least one resolution
            sec_number_level_1 += 1;
            if (kramdown) {
                TOC = TOC.concat(`* [${sec_number_level_1}. Resolutions](#res)\n`);
                content_md = content_md.concat(`\n\n### ${sec_number_level_1}. Resolutions\n{: #res}\n${resolutions}`);
            } else {
                TOC = TOC.concat(`* [${sec_number_level_1}. Resolutions](#${sec_number_level_1}-resolutions)\n`);
                content_md = content_md.concat(`\n\n### ${sec_number_level_1}. Resolutions\n${resolutions}`);
            }
        }
        if (acounter > 1) {
            // There has been at least one resolution
            sec_number_level_1 += 1;
            if (kramdown) {
                TOC = TOC.concat(`* [${sec_number_level_1}. Action Items](#act)\n`);
                content_md = content_md.concat(`\n\n### ${sec_number_level_1}. Action Items\n{: #act}\n${actions}`);
            } else {
                TOC = TOC.concat(`* [${sec_number_level_1}. Action Items](#${sec_number_level_1}-action-items)\n`);
                content_md = content_md.concat(`\n\n### ${sec_number_level_1}. Action Items\n${actions}`);
            }
        }

        // A final bifurcation: if kramdown is used, it is more advantageous to rely on on the
        // TOC generation of kramdown. It makes the ulterior changes of the minutes (eg, adding
        // new sections or subsections) easier, because one does not have to modify the TOC.
        //
        // It is sub-optimal that the TOC content is generated in the previous
        // steps and possibly ignored at this step, but the code would have
        // been much uglier if it was littered with conditionals everywhere...
        return (kramdown ? jekyll_toc : TOC) + content_md;
    }


    // The real steps...
    // 1. cleanup the content, ie, remove the bot commands and the like
    // 2. separate the header information (present, chair, date, etc)
    //    from the 'real' content. That real content is stored in an array
    //    {nick, content} structures

    let { headers, lines } = set_header(cleanup(body)); // eslint-disable-line prefer-const

    // 3. Perform changes, ie, execute on requests of the "s/.../.../" form in the log:
    lines = perform_insert(lines);
    lines = perform_changes(lines);

    // 4. Store the actions' date, if the separate action list handler is available.
    // (the list of actions is created on the fly...)
    if (action_list !== undefined) {
        action_list.set_date(headers.date);
    }

    // 5. Generate the header part of the minutes (using the 'headers' object)
    // 6. Generate the content part, that also includes the TOC, the list of
    //    resolutions and (if any) actions (using the 'lines' array of objects)
    // 7. Return the concatenation of the two
    return (generate_header_md(headers) + generate_content_md(lines));
};
