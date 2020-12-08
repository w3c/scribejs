"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Converter = void 0;
const url = require("url");
const issues = require("./issues");
const utils = require("./utils");
const jsonld_header_1 = require("./jsonld_header");
const types_1 = require("./types");
class Converter {
    constructor(config, action_list) {
        this.config = config;
        this.action_list = action_list;
        this.kramdown = config.jekyll === types_1.Constants.JEKYLL_KRAMDOWN;
    }
    /** ******************************************************************* */
    /*                Helper functions for nicknames                        */
    /** ******************************************************************* */
    /**
     * Get a name structure for a nickname. This relies on the (optional) nickname list that
     * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
     * The configuration structure is also extended to include the nicknames, so that
     * the same full names can be used throughout the minutes.
     *
     * @param nick - name/nickname
     * @returns `name` for the full name and `url`/`github` if available
     */
    get_name(nick) {
        /**
         * Get the nickname mapping structure, if any, for a nickname.
         * Usage of a nickname mapping is really just a beautification step, so if there is
         * a problem in that structure, it should simply ignore it.
         *
         * @param nick - name/nickname
         * @returns {object} the object for the nickname or null if not found
         */
        const nick_mapping = (the_nick) => {
            try {
                const retval = this.config.nicks.find((ns) => ns.nick.includes(the_nick));
                return retval || null;
            }
            catch (e) {
                return null;
            }
        };
        // IRC clients tend to add a '_' to a usual nickname when there
        // are duplicate logins. Then there are the special users, denoted with a '@'.
        // Remove those.
        const clean_nick = utils.canonical_nick(nick);
        // if this nickname has been used before, just return it
        if (this.config.nick_mappings[clean_nick]) {
            return this.config.nick_mappings[clean_nick];
        }
        const person = nick_mapping(clean_nick);
        if (person) {
            this.config.nick_mappings[clean_nick] = person;
            return person;
        }
        else {
            // As a minimal measure, remove the '_' characters from the name
            // (many people use this to signal their presence when using, e.g., present+)
            // Note that this case usually occurs when one time visitors make a `present+ Abc_Def` to appear
            // in the present list; that is why the nick cleanup should not include a lower case conversion.
            return {
                name: utils.canonical_nick(nick, false).replace(/_/g, ' ')
            };
        }
    }
    /**
     * Full name. This relies on the (optional) nickname list that
     * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
     *
     * @param nick - name/nickname
     * @returns  cleaned up name
     */
    full_name(nick) {
        return this.get_name(nick).name;
    }
    /**
     * Provide with the github name for a nickname. This relies on the (optional) nickname list that
     * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
     *
     * @param nick - name/nickname
     * @returns github id. `undefined` if the github id has not been set.
     */
    github_name(nick) {
        return this.get_name(nick).github;
    }
    /**
     * Cleanup nicknames. This relies on the
     * (optional) nickname list that the user may provide, and replaces the
     * (sometimes cryptic) nicknames with real names. Duplicate names are also removed.
     *     *
     * @param nicks - list of names/nicknames
     * @returns list of cleaned up names
     */
    cleanup_names(nicks) {
        const names = nicks.map(this.full_name);
        return utils.uniq(names);
    }
    /** ******************************************************************* */
    /*                        Other helper functions                        */
    /** ******************************************************************* */
    /**
     * Handle the 'scribejs' directives. The directives are of the form "scribejs, COMMAND ARGS" or, equivalently, "sjs, COMMAND ARGS".
     *
     * At the moment there are two possible directives:
     *
     * 1. 'set', adding a temporary nick name (by extending the global data)
     * 2. Handling the issue/pr directives
     *
     * @param line_object - a line object; the only important entry is the 'content'
     * @returns true if the line is _not_ a scribejs directive (ie, the line should be kept), false otherwise
     */
    handle_scribejs(line_object) {
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
                            this.config.nicks.push({
                                nick: [nickname],
                                name: name_comps.join(' ').replace(/_/g, ' ')
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
    cleanup(body) {
        const cleaned_up_lines = body
            .filter((line) => line.length !== 0)
            // Remove the starting time stamp or equivalent. The function
            // relies on the fact that each line starts with a specific number of characters.
            // Alas!, this depends on the irc log format...
            .map((line) => utils.remove_preamble(line, this.config))
            .filter((line) => {
            // this filter is, in fact, unnecessary if rrsagent is properly used
            // however, if the script is used against a line-oriented log
            // of an irc client (like textual) then this come handy in taking
            // out at least some of the problematic lines
            if (this.config.irc_format === undefined) {
                // use the default RRSAgent log, no extra filter is necessary
                return true;
            }
            switch (this.config.irc_format) {
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
        // This is where the IRC log lines are turned into objects, separating the nicknames.
        const line_objects = cleaned_up_lines.map((line) => {
            const sp = line.indexOf(' ');
            return {
                // Note that I remove the '<' and the '>' characters
                // leaving only the real nickname
                nick: line.slice(1, sp - 1),
                content: line.slice(sp + 1).trim()
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
            .filter(this.handle_scribejs);
    }
    /**
     * Generate the Header part of the minutes: present, guests, regrets, chair, etc.
     *
     * Returns a string with the (markdown encoded) version of the header.
     *
     *     private cleanup_names(nicks: string[]): string[] {
        const names: string[] = nicks.map(this.full_name);
        return utils.uniq(names);
    }

     *         // Clean up of the names in the headers: exchange the nicknames for real names
        for (let key in headers) {
            if (Array.isArray(headers[key])) {
                headers[key] = this.cleanup_names(headers[key]);
            }
        }


     * @param headers - the full header structure
     * @returns the header in Markdown
     */
    generate_header_md(headers) {
        // Clean up the names in the headers, just to be on the safe side
        const convert_to_full_name = (nick) => this.full_name(nick);
        for (const key in headers) {
            if (Array.isArray(headers[key])) {
                headers[key] = headers[key]
                    .map((nickname) => nickname.trim())
                    .filter((nickname) => nickname !== '')
                    .map(convert_to_full_name);
                headers[key] = utils.uniq(headers[key]);
            }
        }
        let header_start = '';
        if (this.config.jekyll !== types_1.Constants.JEKYLL_NONE) {
            const json_ld = jsonld_header_1.schema_data(headers, this.config);
            header_start = `---
layout: minutes
date: ${headers.date}
title: ${headers.meeting} — ${headers.date}
json-ld: |
${json_ld}
---
`;
        }
        else if (this.config.pandoc) {
            // TODO: can jekyll and pandoc be used together?
            // ...could use some refactoring for clarity
            header_start = `% ${headers.meeting} — ${headers.date}

![W3C Logo](https://www.w3.org/Icons/w3c_home)

`;
        }
        else {
            header_start = '![W3C Logo](https://www.w3.org/Icons/w3c_home)\n';
        }
        let header_class = '';
        if (this.kramdown) {
            header_class = (this.config.final === true || this.config.auto === false) ? '{: .no_toc}' : '{: .no_toc .draft_notice_needed}';
        }
        else {
            header_class = '';
        }
        const no_toc = (this.kramdown) ? '{: .no_toc}' : '';
        const core_header = `
# ${headers.meeting} — Minutes
${header_class}
${this.config.final === true || this.config.auto === true ? '' : '***– DRAFT Minutes –***'}
${(this.config.final === true || this.config.auto === true) && this.kramdown ? '' : '{: .draft_notice}'}

**Date:** ${headers.date}

See also the [Agenda](${headers.agenda}) and the [IRC Log](${this.config.orig_irc_log})

## Attendees
${no_toc}
**Present:** ${headers.present.join(', ')}

**Regrets:** ${headers.regrets.join(', ')}

**Guests:** ${headers.guests.join(', ')}

**Chair:** ${headers.chair.join(', ')}

**Scribe(s):** ${headers.scribe.join(', ')}
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
     * @returns {string} - the body of the minutes encoded in Markdown
     */
    generate_content_md(lines) {
        // this will be the output
        let final_minutes = '\n---\n';
        // this will be the table of contents
        let TOC = '\n## Content:\n';
        const jekyll_toc = '\n## Content:\n{: .no_toc}\n\n* TOC\n{:toc}';
        // this will be the list or resolutions
        let resolutions = '';
        // this will be the list of actions
        let actions = '';
        /**
        * Table of content handling: a (Sub)topic's is set a label as well as a
        * reference into a table of content structure that grows as we go.
        * Sections (and the TOC entries) are automatically numbered
        */
        let sec_number_level_1 = 0;
        let sec_number_level_2 = 0;
        let numbering = '';
        let header_level = '';
        let toc_spaces = '';
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
                numbering = `${sec_number_level_1}`;
                sec_number_level_2 = 0;
                header_level = '### ';
                toc_spaces = '';
                id = `section${sec_number_level_1}`;
            }
            else {
                sec_number_level_2 += 1;
                numbering = `${sec_number_level_1}.${sec_number_level_2}`;
                header_level = '#### ';
                toc_spaces = '    ';
                id = `section${sec_number_level_1}-${sec_number_level_2}`;
            }
            if (this.kramdown) {
                final_minutes = final_minutes.concat('\n\n', `${header_level}${numbering}. ${bare_content}\n{: #${id}}`);
                TOC = TOC.concat(`${toc_spaces}* [${numbering}. ${bare_content}](#${id})\n`);
            }
            else {
                const auto_id = `${numbering}-${bare_content.toLowerCase().replace(/ /g, '-')}`;
                final_minutes = final_minutes.concat('\n\n', `${header_level}${numbering}. ${bare_content}`);
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
            if (this.kramdown) {
                final_minutes = final_minutes.concat(`\n\n> ***Resolution #${rcounter}: ${content}***\n{: #${id} .resolution}`);
                resolutions = resolutions.concat(`\n* [Resolution #${rcounter}](#${id}): ${content}`);
            }
            else {
                final_minutes = final_minutes.concat(`\n\n> ***Resolution #${rcounter}: ${content}***`);
                // GFM and CommonMark do not support anchor creation...so we can't link to the resolutions :-(
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
                const ghname = this.github_name(words[0]);
                const name = this.full_name(words[0]);
                const message = words.slice(2).join(' ');
                const final_content = `${message} (${name})`;
                const id = `action${acounter}`;
                if (this.kramdown) {
                    final_minutes = final_minutes.concat(`\n\n> ***Action #${acounter}: ${final_content}***\n{: #${id} .action}`);
                    actions = actions.concat(`\n* [Action #${acounter}](#${id}): ${final_content}`);
                }
                else {
                    final_minutes = final_minutes.concat(`\n\n> ***Action #${acounter}: ${final_content}***`);
                    // GFM and CommonMark do not support anchor creation...so we can't link to the actions T_T
                    actions = actions.concat(`\n* Action #${acounter}: ${final_content}`);
                }
                acounter += 1;
                // ------
                // Store the actions, if the separate action list handler is available
                // add_action(name, action, id)
                if (this.action_list !== undefined) {
                    this.action_list.add_action(`${id}`, message, name, ghname);
                }
            }
            else {
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
        };
        // "state" variables for the main cycle...
        let scribes = [];
        // This is important if the scribe portion is 'interrupted' by, e.g., a topic setting or a resolution;
        // this helps in re-establishing the current speaker
        let within_scribed_content = false;
        let current_person = '';
        // The main cycle on the content
        for (const line_object of lines) {
            // This is declared here to use an assignment in a conditional below...
            let issue_match;
            // What is done depends on some context...
            // Do we have a new scribe?
            const new_scribe_list = utils.get_name_list(scribes, line_object, 'scribe') || utils.get_name_list(scribes, line_object, 'scribenick');
            if (new_scribe_list) {
                scribes = new_scribe_list.map((person) => utils.canonical_nick(person));
                // this line can be forgotten...
                break;
            }
            // Add links, and separate the label (ie, "topic:", "proposed:", etc.) from the rest
            const content_with_links = add_links(line_object.content);
            const { label, content } = utils.get_label(content_with_links);
            // First handle special entries that must be handled regardless
            // of whether it was typed in by the scribe or not.
            if (label !== null && label.toLowerCase() === 'topic') {
                // Topic must be combined with handling of issues, because a topic may include the @issue X,Y,Z directive
                within_scribed_content = false;
                const title_structure = issues.titles(this.config, content);
                add_toc(title_structure.title_text, 1);
                if (title_structure.issue_reference !== '') {
                    final_minutes = final_minutes.concat(title_structure.issue_reference);
                }
            }
            else if (label !== null && label.toLowerCase() === 'subtopic') {
                // Topic must be combined with handling of issues, because a topic may include the @issue X,Y,Z directive
                within_scribed_content = false;
                const title_structure = issues.titles(this.config, content);
                add_toc(title_structure.title_text, 2);
                if (title_structure.issue_reference !== '') {
                    final_minutes = final_minutes.concat(title_structure.issue_reference);
                }
            }
            else if (label !== null && ['proposed', 'proposal', 'propose'].includes(label.toLowerCase())) {
                within_scribed_content = false;
                final_minutes = final_minutes.concat(`\n\n> **Proposed resolution: ${content}** *(${this.full_name(line_object.nick)})*`);
                if (this.kramdown) {
                    final_minutes = final_minutes.concat('\n{: .proposed_resolution}');
                }
            }
            else if (label !== null && label.toLowerCase() === 'summary') {
                within_scribed_content = false;
                final_minutes = final_minutes.concat(`\n\n> **Summary: ${content}** *(${this.full_name(line_object.nick)})*`);
                if (this.kramdown) {
                    final_minutes = final_minutes.concat('\n{: .summary}');
                }
            }
            else if (label !== null && ['resolved', 'resolution'].includes(label.toLowerCase())) {
                within_scribed_content = false;
                add_resolution(content);
            }
            else if (label !== null && label.toLowerCase() === 'action') {
                within_scribed_content = false;
                add_action(content);
                // eslint-disable-next-line no-cond-assign
            }
            else if ((issue_match = content.match(types_1.Constants.issue_regexp)) !== null) {
                within_scribed_content = false;
                const directive = issue_match[2];
                const issue_references = issue_match[3];
                final_minutes = final_minutes.concat(issues.issue_directives(this.config, directive, issue_references));
            }
            else if (scribes.includes(utils.canonical_nick(line_object.nick))) {
                // This is a line produced one of the 'registered' scribes
                if (label !== null) {
                    // A new person is talking...
                    // Note the two spaces at the end of the generated line, this
                    // ensure line breaks within the paragraph!
                    // But... maybe this is not a new person after all! (Scribes, sometimes, forget about the usage of '...' or prefer to use the nickname)
                    if (within_scribed_content && this.full_name(label) === this.full_name(current_person)) {
                        // Just mimic the continuation line:
                        final_minutes = final_minutes.concat(`\n… ${content}  `);
                    }
                    else {
                        final_minutes = final_minutes.concat(`\n\n**${this.full_name(label)}:** ${content}  `);
                        current_person = label;
                        within_scribed_content = true;
                    }
                }
                else {
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
                            final_minutes = final_minutes.concat('\n… ', new_content, '  ');
                        }
                        else {
                            // For some reasons, there was a previous line
                            // that interrupted the normal flow, a new
                            // paragraph should be started
                            final_minutes = final_minutes.concat(`\n\n**${this.full_name(current_person)}:** ${new_content}  `);
                            // content_md = content_md.concat("\n\n", content.slice(dots))
                            within_scribed_content = true;
                        }
                    }
                    else {
                        // It is the scribe talking. Except if the scribe
                        // forgot to put the "...", but we cannot really
                        // help that:-(
                        within_scribed_content = false;
                        // This is a fall back: somebody (not the scribe) makes a note on IRC
                        final_minutes = final_minutes.concat(`\n\n> *${this.full_name(line_object.nick)}:* ${content_with_links}`);
                    }
                }
            }
            else {
                // This is a fall back: somebody (not the scribe) makes a note on IRC
                within_scribed_content = false;
                final_minutes = final_minutes.concat(`\n\n> *${this.full_name(line_object.nick)}:* ${content_with_links}`);
            }
        }
        // Endgame: pulling the TOC, the real minutes and, possibly, the
        // resolutions and actions together
        final_minutes = final_minutes.concat('\n\n---\n');
        if (rcounter > 1) {
            // There has been at least one resolution
            sec_number_level_1 += 1;
            if (this.kramdown) {
                TOC = TOC.concat(`* [${sec_number_level_1}. Resolutions](#res)\n`);
                final_minutes = final_minutes.concat(`\n\n### ${sec_number_level_1}. Resolutions\n{: #res}\n${resolutions}`);
            }
            else {
                TOC = TOC.concat(`* [${sec_number_level_1}. Resolutions](#${sec_number_level_1}-resolutions)\n`);
                final_minutes = final_minutes.concat(`\n\n### ${sec_number_level_1}. Resolutions\n${resolutions}`);
            }
        }
        if (acounter > 1) {
            // There has been at least one resolution
            sec_number_level_1 += 1;
            if (this.kramdown) {
                TOC = TOC.concat(`* [${sec_number_level_1}. Action Items](#act)\n`);
                final_minutes = final_minutes.concat(`\n\n### ${sec_number_level_1}. Action Items\n{: #act}\n${actions}`);
            }
            else {
                TOC = TOC.concat(`* [${sec_number_level_1}. Action Items](#${sec_number_level_1}-action-items)\n`);
                final_minutes = final_minutes.concat(`\n\n### ${sec_number_level_1}. Action Items\n${actions}`);
            }
        }
        // A final bifurcation: if kramdown is used, it is more advantageous to rely on on the
        // TOC generation of kramdown. It makes the ulterior changes of the minutes (eg, adding
        // new sections or subsections) easier, because one does not have to modify the TOC.
        //
        // It is sub-optimal that the TOC content is generated in the previous
        // steps and possibly ignored at this step, but the code would have
        // been much uglier if it was littered with conditionals everywhere...
        return (this.kramdown ? jekyll_toc : TOC) + final_minutes;
    }
    /**
     * The main entry point: generate the full content in the form of a large string (the minutes in markdown);
     *
     * @param body - the IRC log; this is either a string or an array of strings; the latter happens when the code is called on the client side
     */
    convert_to_markdown(body) {
        // An array of lines should be used down from this point.
        const split_body = Array.isArray(body) ? body : body.split(/\n/);
        // 1. cleanup the content, ie, remove the bot commands and the like
        // 2. separate the header information (present, chair, date, etc)
        //    from the 'real' content. That real content is stored in an array
        //    {nick, content} structures
        const irc_log = this.cleanup(split_body);
        let { headers, lines } = utils.separate_header(irc_log, this.config.date);
        // 3. Perform changes, ie, execute on requests of the "s/.../.../" form in the log:
        lines = utils.perform_insert(lines);
        lines = utils.perform_changes(lines);
        // 4. Store the actions' date, if the separate action list handler is available.
        // (the list of actions is created on the fly...)
        if (this.action_list !== undefined) {
            this.action_list.set_date(headers.date);
        }
        // 5. Generate the header part of the minutes (using the 'headers' object)
        const header_md = this.generate_header_md(headers);
        // 6. Generate the content part, that also includes the TOC, the list of
        //    resolutions and (if any) actions (using the 'lines' array of objects)
        const content_md = this.generate_content_md(lines);
        // 7. Return the concatenation of the two
        return header_md + content_md;
    }
}
exports.Converter = Converter;
//# sourceMappingURL=convert.js.map