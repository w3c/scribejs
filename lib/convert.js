'use strict';

const _    = require('underscore');
const url  = require('url');
const safe = require('safe-regex');

const JEKYLL_NONE     = 'none';
// TODO: define and use JEKYLL_MARKDOWN
const JEKYLL_KRAMDOWN = 'kd';

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
        if (['http', 'https', 'email', 'ftp'].includes(possible_label)) {
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
     * Get the nickname mapping structure, if any, for a nickname.
     * Usage of a nickname mapping is really just a beautification step, so if there is
     * a problem in that structure, it should simply ignore it.
     *
     * @param {string} nick - name/nickname
     * @returns {object} the object for the nickname or null if not found
     */
    function get_nick_mapping(nick) {
        // IRC clients tend to add a '_' to a usual nickname when there
        // are duplicate logins. Remove that
        const clean_nick = nick.replace(/^_+/, '').replace(/_+$/, '')
            .replace(/^@/, '');

        try {
            for (let i = 0; i < config.nicks.length; i++) {
                const struct = config.nicks[i];
                if (_.indexOf(struct.nick, clean_nick.toLowerCase()) !== -1) {
                    // bingo, the right structure has been found:
                    return struct;
                }
            }
        } catch (e) {
            return null;
        }
        // If we got here, there isn't any structure defined for this nickname
        return null;
    }


    /**
     * Get a name structure for a nickname. This relies on the (optional) nickname list that
     * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
     * The configuration structure is also extended to include the nicknames, so that
     * the same full names can be used throughout the minutes.
     *
     * @param {string} nick - name/nickname
     * @returns {object} - `name` for the full name and `url` if available
     */
    function get_name(nick) {
        // IRC clients tend to add a '_' to a usual nickname when there
        // are duplicate logins. Remove that
        const clean_nick = nick.replace(/^_+/, '').replace(/_+$/, '').replace(/^@/, '');
        // if this nickname has been used before, just return it
        if (config.nick_mappings[clean_nick]) {
            return config.nick_mappings[clean_nick];
        }

        const struct = get_nick_mapping(clean_nick);
        if (struct) {
            config.nick_mappings[clean_nick] = { name: struct.name };
            if (struct.url) config.nick_mappings[clean_nick].url = struct.url;
            if (struct.github) config.nick_mappings[clean_nick].github = struct.github;

            return config.nick_mappings[clean_nick];
        }

        // As a minimal measure, remove the '_' characters from the name
        // (many people use this to signal their presence when using, e.g., present+)
        return { name: clean_nick.replace(/_/g, ' ') };
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
        return lower.startsWith(`${label}:`) === true
            ? line.content.slice(label_length).trim()
            : null;
    }


    /**
     * Extract the scribe's nick from the line, ie, see if the label
     * "scribenick" or "scribe" is used
     *
     * @param {object} line - a line object of the form {nick, content}
     * @returns {string} - the scribe name or null
     *
     */
    const get_scribe = (line) => (get_labelled_item('scribenick', line) || get_labelled_item('scribe', line));


    /**
     * Handle the 'scribejs' directives. The directives are of the form "scribejs, COMMAND ARGS".
     *
     * At the moment, the only directive is 'set', adding a temporary nick name
     * to the ones coming from the nickname file
     *
     * @param {object} line_object - a line object; the only important entry is the 'content'
     * @returns {boolean} - true if the line is _not_ a scribejs directive
     *     (ie, the line should be kept), false otherwise
     */
    function handle_scribejs(line_object) {
        if (line_object.content_lower.startsWith('scribejs,')) {
            // If there is a problem somewhere, it should simply be forgotten
            // these are all beautifying steps, ie, an exception could be ignored
            try {
                const words = line_object.content.split(' ');
                switch (words[1]) {
                    // Set a per-session nickname.
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
     *  - handle the "scribejs, nick FULL NAME" type commands
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
        return _.chain(split_body)
            .filter((line) => (_.size(line) !== 0))
            // Remove the starting time stamp, by cutting off until the first space
            // Note: these parts may have to be redone, possibly through a
            //  specific helper function, if the script is adapted to a larger
            //  palette of IRC client loggers, too.
            .map((line) => line.slice(line.indexOf(' ') + 1))
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
            .map((line_object) => {
                line_object.content = line_object.content.replace(/<(\w*\/?)>/g, '`<$1>`');
                return line_object;
            })
            // Add a lower case version of the content to the objects; this will be used
            // for comparisons later
            .map((line_object) => {
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
                line_object.content_lower.startsWith('q+')
                || line_object.content_lower.startsWith('+q')
                || line_object.content_lower.startsWith('q-')
                || line_object.content_lower.startsWith('q?')
                || line_object.content_lower.startsWith('ack')
                || line_object.content_lower.startsWith('agenda+')
                || line_object.content_lower.startsWith('agenda?')
                || line_object.content_lower.startsWith('trackbot,')
                || line_object.content_lower.startsWith('zakim,')
                || line_object.content_lower.startsWith('rrsagent,')
                || line_object.content_lower.startsWith('github topic')
                || line_object.content_lower.startsWith('github-bot,')
            ))
            // People often forget to add the 'present+'. Trying to be accommodating, the
            // script add it for all the "joining lines", provided the nickname
            // is mapped through the mapping file, which establishes that the nickname
            // indeed belongs to a bona fide member of the WG.
            // 2018-10-29: I have removed this feature. It did more harm than good
            // (many people 'lurk' into
            // an IRC, and these created a number of false positives).
            // Such lines are simply removed.
            .filter((line_object) => {
                if (line_object.content.match(/^\w+ has joined #\w+/)) {
                    // see if a nickname mapping has been defined for this row
                    // if (get_nick_mapping(line_object.nick)) {
                    //     // Yep. The content is modified into a "present+" and
                    //     // the line is good to go
                    //     line_object.content_lower = 'present+';
                    //     line_object.content = 'present+';
                    //     return true;
                    // }
                    return false;
                }
                // Line should be kept
                return true;
            })
            // There are some irc messages that should be taken care of
            .filter((line_object) => !(
                line_object.content.match(/^\w+ has left #\w+/)
                || line_object.content.match(/^\w+ has changed the topic to:/)
            ))
            // Handle the scribejs directives
            .filter(handle_scribejs)
            // End of the underscore chain, retrieve the final value
            .value();
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
     *   - scribenick: comma separated IRC nicknames
     * All these actions, except for 'scribenick', also remove the corresponding
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
         * @param {string} category - the 'label' to look for
         * @param {object} line - IRC line object
         * @returns {boolean} - true or false, depending on whether this is
         *     indeed a line with that category
         */
        // Care should be taken to trim everything, to keep the nick names clean of extra spaces...
        function people(category, line) {
            // A frequent mistake is to use "guest" instead of "guests", or
            // "regret" instead of "regrets". Although the "official" documented
            // version is the plural form, I decided to make the script resilient...
            let real_category = category;
            if (category === 'guest') real_category = 'guests';
            else if (category === 'regret') real_category = 'regrets';

            const get_names = (index) => {
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
                if (lower.startsWith(`${category}+`) === true) {
                    names = get_names(cutIndex);
                } else if (lower.startsWith(`${category} +`) === true) {
                    // Note that, although the correct syntax is "present+", a frequent
                    // mistake is to type "present +". I decided to make the script
                    // resilient on this:-)
                    names = get_names(cutIndex + 1);
                } else if (lower.startsWith(`${category}-`) === true) {
                    names = get_names(cutIndex);
                    action = _.difference;
                } else if (lower.startsWith(`${category} -`) === true) {
                    // Note that, although the correct syntax is "present-", a frequent
                    // mistake is to type "present -". I decided to make the script
                    // resilient on this:-)
                    names = get_names(cutIndex + 1);
                    action = _.difference;
                } else if (lower.startsWith(`${category}:`) === true) {
                    names = line.content.slice(cutIndex + 1).trim().split(',');
                } else {
                    // This is not a correct usage...
                    return false;
                }
                headers[real_category] = action(headers[real_category],
                                                _.map(names, (name) => name.trim()));
                return true;
            }
            return false;
        }


        /**
         * Extract single items like "agenda:" or "chairs:"
         * If found, the relevant field in the header object is set.
         *
         * @param {string} category - the 'label' to look for
         * @param {object} line - IRC line object
         * @returns {boolean} - true or false, depending on whether this is
         *     indeed a line with that category
         */
        function single_item(category, line) {
            const item = get_labelled_item(category, line);
            if (item !== null) {
                headers[category] = item;
                return true;
            }
            return false;
        }


        /**
         * Handle the scribe(s): see if this is a scribe setting line. If so, extends the header.
         *
         * @param {object} line - IRC line object
         * @returns {boolean} - always true (this function is used in a filter;
         *     this means that the line stays in the IRC log for now!)
         */
        function handle_scribes(line) {
            const scribenick = get_scribe(line);
            if (scribenick !== null) {
                headers.scribe.push(scribenick);
            }
            return true;
        }


        // filter out all irc log lines that are related to header information
        const processed_lines = _.chain(lines)
            .filter((line) => !people('present', line))
            .filter((line) => !people('regrets', line))
            .filter((line) => !people('regret', line))
            .filter((line) => !people('guests', line))
            .filter((line) => !people('guest', line))
            .filter((line) => !people('chair', line))
            .filter((line) => !single_item('agenda', line))
            .filter((line) => !single_item('meeting', line))
            .filter((line) => !single_item('date', line))
            .filter((line) => handle_scribes(line))
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
        const get_insert_request = (str) => str.match(/^i\/([^/]+)\/([^/]+)\/{0,1}/)
            || str.match(/^i\|([^|]+)\|([^|]+)\|{0,1}/);
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
        const get_change_request = (str) => str.match(/^s\/([^/]+)\/([^/]*)\/{0,1}(g|G){0,1}/)
            || str.match(/^s\|([^|]+)\|([^/|]*)\|{0,1}(g|G){0,1}/);
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
            header_start = `---
layout: minutes
date: ${headers.date}
title: ${headers.meeting} — ${headers.date}
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

        const draft_class = kramdown && !config.final ? '{: .draft_notice}' : '';
        const no_toc      = kramdown ? '{: .no_toc}' : '';

        const core_header = `
# ${headers.meeting} — Minutes
${no_toc}
${config.final ? '' : '***– DRAFT Minutes –***'}
${draft_class}

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

        function add_toc(content, level) {
            // id is used to set the @id value for the section header. For some
            // reasons, the '.' is not accepted at least by jekyll for a proper
            // TOC, so the '-' must be used.
            let id = '';
            if (level === 1) {
                sec_number_level_1 += 1;
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
                content_md = content_md.concat('\n\n', `${header_level}${numbering}. ${content}\n{: #${id}}`);
                TOC = TOC.concat(`${toc_spaces}* [${numbering}. ${content}](#${id})\n`);
            } else {
                const auto_id = `${numbering}-${content.toLowerCase().replace(/ /g, '-')}`;
                content_md = content_md.concat('\n\n', `${header_level}${numbering}. ${content}`);
                TOC = TOC.concat(`${toc_spaces}* [${numbering}. ${content}](#${auto_id})\n`);
            }
        }

        /**
        * Resolution handling: the resolution receives an ID, and a list of
        * resolution is repeated at the end
        */
        let rcounter = 1;
        function add_resolution(content) {
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
        }

        /**
        * Action handling: the action receives an ID, and a list of actions is repeated at the end
        */
        let acounter = 1;
        function add_action(content) {
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
        }

        /**
        * URL handling: find URL-s in a line and convert it into an active markdown link
        */
        function add_links(line) {
            const check = (str) => {
                const a = url.parse(str);
                return a.protocol !== null
                    && _.indexOf(['http:', 'https:', 'ftp:', 'mailto:', 'doi:'], a.protocol) !== -1;
            };
            // 1. separate the line into an array of words:
            // 2. handle each word one by one to possibly turn it into an active link
            // 3. join the array back into a sentence
            return _.map(line.split(' '), (word) => (check(word) ? `[${word}](${word})` : word)).join(' ');
        }

        // "state" variables for the main cycle...
        let current_scribe         = '';
        let within_scribed_content = false;
        let current_person         = '';
        // The main cycle on the content
        _.forEach(lines, (line_object) => {
            // What is done depends on some context...
            // Do we have a new scribe?
            const scribe = get_scribe(line_object);
            if (scribe !== null) {
                // This is a scribe change command; the current scribe must be updated,
                // and the line ignored
                current_scribe = scribe.toLowerCase();
                return;
            }
            // Separate the label from the rest
            const { label, content } = get_label(line_object.content);

            // First handle special entries that must be handled regardless
            // of whether it was typed in by the scribe or not.
            if (label !== null && label.toLowerCase() === 'topic') {
                within_scribed_content = false;
                add_toc(content, 1);
            } else if (label !== null && label.toLowerCase() === 'subtopic') {
                within_scribed_content = false;
                add_toc(content, 2);
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
            } else if (line_object.nick.toLowerCase() === current_scribe) {
                // Done with the special entries, filter the scribe entries
                if (label !== null) {
                    // A new person is talking...
                    // Note the two spaces at the end of the line, this
                    // ensure line breaks within the paragraph!
                    // But... maybe this is not a new person after all! (Scribes, sometimes, forget about the usage of '...')
                    if (cleanup_name(label) === cleanup_name(current_person)) {
                        // Just mimic the continuation line:
                        content_md = content_md.concat(`\n… ${content}  `);
                    } else {
                        content_md = content_md.concat(`\n\n**${cleanup_name(label)}:** ${content}  `);
                        current_person = label;
                    }
                    within_scribed_content = true;
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
                        content_md = content_md.concat(
                            `\n\n> *${cleanup_name(line_object.nick)}:* ${add_links(line_object.content)}`
                        );
                    }
                }
            } else {
                within_scribed_content = false;
                // This is a fall back: somebody (not the scribe) makes a note on IRC
                content_md = content_md.concat(
                    `\n\n> *${cleanup_name(line_object.nick)}:* ${add_links(line_object.content)}`
                );
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
