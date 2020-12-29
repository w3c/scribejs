"use strict";
/**
 * ## Retrieving the configuration files and merge them into the final configuration structure
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Converter = void 0;
const issues = require("./issues");
const utils = require("./utils");
const front_matter_1 = require("./front_matter");
const types_1 = require("./types");
const actions_1 = require("./actions");
/**
 * The "top level" class to perform the conversion.
 */
class Converter {
    /**
     *
     * @param config - the global data. Some of the fields are only placeholders and are filled in while processing
     */
    constructor(config) {
        this.global = config;
        this.global.action_list = new actions_1.Actions(config);
        this.global.resolution_list = [];
        this.kramdown = config.jekyll === types_1.Constants.JEKYLL_KRAMDOWN;
    }
    /** ******************************************************************* */
    /*                Helper functions for nicknames                        */
    /** ******************************************************************* */
    /**
     * Get a Person structure for a nickname. This relies on the (optional) nickname list that
     * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
     * The configuration structure is also extended to include the nicknames, so that
     * the same full names can be used throughout the minutes.
     *
     * @param nick - name/nickname
     * @returns The structure includes `name` for the full name and `url`/`github`/`role` if available.
     */
    get_name(nick) {
        /**
         * Get the nickname mapping structure, if available, for a nickname.
         * Usage of a nickname mapping is really just a beautification step, so if there is
         * a problem in that structure, it should simply ignore it.
         *
         * @param nick - name/nickname
         * @returns {object} the object for the nickname or null if not found
         */
        const nick_mapping = (the_nick) => {
            try {
                const retval = this.global.nicks.find((ns) => ns.nick.includes(the_nick));
                return retval || null;
            }
            catch (e) {
                return null;
            }
        };
        // IRC clients tend to add a '_' to a usual nickname when there
        // are duplicate logins. Also, there are the special users denoted with a '@'.
        // Remove those.
        const clean_nick = utils.canonical_nick(nick);
        // if this nickname has been used before, just return it
        if (this.global.nick_mappings[clean_nick]) {
            return this.global.nick_mappings[clean_nick];
        }
        else {
            const person = nick_mapping(clean_nick);
            if (person) {
                this.global.nick_mappings[clean_nick] = person;
                return person;
            }
            else {
                // As a minimal measure, remove the '_' characters from the name
                // (many people use this to signal their presence when using, e.g., present+)
                // Note that this case usually occurs when one time visitors make a `present+ Abc_Def` to appear
                // in the present list; that is why the nick cleanup should not include a lower case conversion.
                return {
                    name: utils.canonical_nick(nick, false).replace(/_/g, ' '),
                };
            }
        }
    }
    /**
     * Full name. This relies on the (optional) nickname list that
     * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
     *
     * @param nick - name/nickname
     * @returns  (real) full name (extracted from the corresponding [[Person]] structure)
     */
    full_name(nick) {
        return this.get_name(nick).name;
    }
    /**
     * Provide with the github name for a nickname. This relies on the (optional) nickname list that
     * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
     *
     * @param nick - name/nickname
     * @returns github id (extracted from the corresponding [[Person]] structure). `undefined` if the github id has not been set.
     */
    github_name(nick) {
        return this.get_name(nick).github;
    }
    /** ******************************************************************* */
    /**
     * Clean up the names in the header, i.e., make sure that all names are full names instead of nicknames, and that there are also no duplicates.
     */
    cleanup_names_in_header(headers) {
        const convert_to_full_name = (nick) => this.full_name(nick);
        // Clean up all the names in the headers, just to be on the safe side
        for (const key in headers) {
            if (Array.isArray(headers[key])) {
                headers[key] = headers[key]
                    .map((nickname) => nickname.trim())
                    .filter((nickname) => nickname !== '')
                    .map(convert_to_full_name);
                // Take care of removing duplicates
                headers[key] = utils.uniq(headers[key]);
            }
        }
        return headers;
    }
    /**
     * Generate the preamble part of the minutes: present, guests, regrets, chair, etc. The nicknames stored in the incoming structure are converted into real names via the [[full_name]] method.
     *
     * Returns a string with the (markdown encoded) version of the header.
     *
     * @param headers - the full header structure
     * @returns the preamble in Markdown
     */
    generate_preamble(headers) {
        let header_class = '';
        if (this.kramdown) {
            header_class = (this.global.final === true || this.global.auto === false) ? '{: .no_toc}' : '{: .no_toc .draft_notice_needed}';
        }
        else {
            header_class = '';
        }
        const no_toc = (this.kramdown) ? '{: .no_toc}' : '';
        const core_header = `
# ${headers.meeting} — Minutes
${header_class}
${this.global.final === true || this.global.auto === true ? '' : '***– DRAFT Minutes –***'}
${(this.global.final === true || this.global.auto === true) && this.kramdown ? '' : '{: .draft_notice}'}

**Date:** ${headers.date}

See also the [Agenda](${headers.agenda}) and the [IRC Log](${this.global.orig_irc_log})

## Attendees
${no_toc}
**Present:** ${headers.present.join(', ')}

**Regrets:** ${headers.regrets.join(', ')}

**Guests:** ${headers.guests.join(', ')}

**Chair:** ${headers.chair.join(', ')}

**Scribe(s):** ${headers.scribe.join(', ')}
`;
        return core_header;
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
    // eslint-disable-next-line max-lines-per-function
    generate_content(lines) {
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
        /**
         * Add a new header level to the TOC and generate the right markdown
         *
         * @param content Content of the IRC log line
         * @param level header level
         * @return the final lines in the minutes in Markdown
         */
        const add_to_toc = (content, level) => {
            let retval = '';
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
                retval = `\n\n${header_level}${numbering}. ${bare_content}\n{: #${id}}`;
                TOC += `${toc_spaces}* [${numbering}. ${bare_content}](#${id})\n`;
            }
            else {
                const auto_id = `${numbering}-${bare_content.toLowerCase().replace(/ /g, '-')}`;
                retval = `\n\n${header_level}${numbering}. ${bare_content}`;
                TOC += `${toc_spaces}* [${numbering}. ${bare_content}](#${auto_id})\n`;
            }
            return retval;
        };
        let rcounter = 1;
        /**
         * Resolution handling: the resolution receives an ID, and a list of
         * resolution is repeated at the end
         *
         * @param content Content of the IRC log line
         * @return the final lines in the minutes in Markdown
         */
        const add_to_resolutions = (content) => {
            const id = `resolution${rcounter}`;
            let retval = '';
            if (this.kramdown) {
                retval = `\n\n> ***Resolution #${rcounter}: ${content}***\n{: #${id} .resolution}`;
                resolutions = resolutions.concat(`\n* [Resolution #${rcounter}](#${id}): ${content}`);
            }
            else {
                retval = `\n\n> ***Resolution #${rcounter}: ${content}***`;
                // GFM and CommonMark do not support anchor creation...so we can't link to the resolutions :-(
                resolutions = resolutions.concat(`\n* Resolution #${rcounter}: ${content}`);
            }
            this.global.resolution_list.push({
                resolution_number: rcounter,
                resolution_text: content,
            });
            rcounter += 1;
            return retval;
        };
        let acounter = 1;
        /**
         * Action handling: the action receives an ID, and a list of actions is repeated at the end
         *
         * @param content Content of the IRC log line
         * @return the final lines in the minutes in Markdown
         */
        const add_to_actions = (content) => {
            let retval = '';
            const words = content.trim().split(' ');
            if (words[1] === 'to') {
                const ghname = this.github_name(words[0]);
                const name = this.full_name(words[0]);
                const message = words.slice(2).join(' ');
                const final_content = `${message} (${name})`;
                const id = `action${acounter}`;
                if (this.kramdown) {
                    retval = `\n\n> ***Action #${acounter}: ${final_content}***\n{: #${id} .action}`;
                    actions = actions.concat(`\n* [Action #${acounter}](#${id}): ${final_content}`);
                }
                else {
                    retval = `\n\n> ***Action #${acounter}: ${final_content}***`;
                    // GFM and CommonMark do not support anchor creation...so we can't link to the actions T_T
                    actions = actions.concat(`\n* Action #${acounter}: ${final_content}`);
                }
                acounter += 1;
                // ------
                // Store the actions, if the separate action list handler is available
                // add_action(name, action, id)
                this.global.action_list.add_action(`${id}`, message, name, ghname);
            }
            else {
                console.log(`Warning: incorrect action syntax used: ${words}`);
            }
            return retval;
        };
        /* ----------- The core of the cycle: going through the IRC log line and do what is necessary ------------------- */
        /* ----------- the final minutes are collected in the "final_minutes" string, that is returned to the caller ---- */
        // "state" variables for the main cycle...
        let scribes = [];
        // This is important if the scribe portion is 'interrupted' by, e.g., a topic setting or a resolution;
        // this helps in re-establishing the current speaker
        let within_scribed_content = false;
        // Storing the reference to the current person is important to "combine" the comments
        // coming from the same person to a series of lines connected by a '...', even if the scribe
        // chooses to put in the person's nickname at every line.
        let current_person = '';
        // ------------------------------  The main cycle on the content: take each line one-by-one and turn it into Github...
        for (const line_object of lines) {
            // This is declared here to use an assignment in a conditional below...
            let issue_match;
            // What has to be done done depends on some context...
            // Do we have a new scribe? If so, he/she should be added to the list of scribes
            const new_scribe_list = utils.get_name_list(scribes, line_object, 'scribe') || utils.get_name_list(scribes, line_object, 'scribenick');
            if (new_scribe_list) {
                scribes = new_scribe_list.map((person) => utils.canonical_nick(person));
                // this line can be forgotten...
                continue;
            }
            // Add links using the the various possibilities offered by the '-> ...' syntax.
            const content_with_links = utils.add_links(line_object.content);
            // Separate the label (ie, "topic:", "proposed:", etc.) from the rest
            const { label, content } = utils.get_label(content_with_links);
            // First handle special entries that must be handled regardless
            // of whether it was typed by the scribe or not; the scribe specific handling is left to the end
            // Most of the special cases are based on the label, if applicable.
            // Handle a new topic: separate the possible issue/pr reference, add a TOC item and display the header with a '###'
            // The separate utility function that handles the issue/pr directives
            // The 'add_to_toc' function above generates the right markdown.
            if (label !== null && label.toLowerCase() === 'topic') {
                // Topic must be combined with handling of issues, because a topic may include the @issue X,Y,Z directive
                within_scribed_content = false;
                const title_structure = issues.titles(this.global, content);
                final_minutes += add_to_toc(title_structure.title_text, 1);
                if (title_structure.issue_reference !== '') {
                    final_minutes += title_structure.issue_reference;
                }
                // Handle a new topic: separate the possible issue/pr reference, add a TOC item and display the header with a '####'
                // The separate utility function that handles the issue/pr directives
                // The 'add_to_toc' function above generates the right markdown.
            }
            else if (label !== null && label.toLowerCase() === 'subtopic') {
                // Topic must be combined with handling of issues, because a topic may include the @issue X,Y,Z directive
                within_scribed_content = false;
                const title_structure = issues.titles(this.global, content);
                final_minutes += add_to_toc(title_structure.title_text, 2);
                if (title_structure.issue_reference !== '') {
                    final_minutes += title_structure.issue_reference;
                }
                // Handle a resolution proposal, displayed with a special markdown
            }
            else if (label !== null && ['proposed', 'proposal', 'propose'].includes(label.toLowerCase())) {
                within_scribed_content = false;
                final_minutes += `\n\n> **Proposed resolution: ${content}** *(${this.full_name(line_object.nick)})*`;
                if (this.kramdown) {
                    final_minutes += '\n{: .proposed_resolution}';
                }
                // Handle a discussion summary, displayed with a special markdown
            }
            else if (label !== null && label.toLowerCase() === 'summary') {
                within_scribed_content = false;
                final_minutes += `\n\n> **Summary: ${content}** *(${this.full_name(line_object.nick)})*`;
                if (this.kramdown) {
                    final_minutes += '\n{: .summary}';
                }
                // Handle a resolution: the resolution must be stored separately and a special markdown is used
            }
            else if (label !== null && ['resolved', 'resolution'].includes(label.toLowerCase())) {
                within_scribed_content = false;
                final_minutes += add_to_resolutions(content);
                // Handle an action: the action must be stored separately, and a special markdown is used
            }
            else if (label !== null && label.toLowerCase() === 'action') {
                within_scribed_content = false;
                final_minutes += add_to_actions(content);
                // Handle an issue directive: the line is replaced with a set of references and a possible
                // extra comment for postprocessing
            }
            else if ((issue_match = content.match(types_1.Constants.issue_regexp)) !== null) {
                within_scribed_content = false;
                const directive = issue_match[2];
                const issue_references = issue_match[3];
                final_minutes += issues.issue_directives(this.global, directive, issue_references);
                // The 'scribed' line, ie, the lines whose 'nick' is one of the registered scribes.
            }
            else if (scribes.includes(utils.canonical_nick(line_object.nick))) {
                if (label !== null) {
                    // A new person is talking...
                    // Note the two spaces at the end of the generated line, this
                    // ensure line breaks within the paragraph!
                    // But... maybe this is not a new person after all! (Scribes, sometimes, forget about the usage of '...' or prefer to use the nickname)
                    if (within_scribed_content && this.full_name(label) === this.full_name(current_person)) {
                        // Just mimic the continuation line:
                        final_minutes += `\n… ${content}  `;
                    }
                    else {
                        // Yep, this is indeed a new person talking
                        final_minutes += `\n\n**${this.full_name(label)}:** ${content}  `;
                        current_person = label;
                        within_scribed_content = true;
                    }
                }
                else {
                    // This is a 'continuation' line
                    // There are two types of continuation lines, we have to get the number of characters
                    // eslint-disable-next-line no-nested-ternary
                    const dots = content.startsWith('...') ? 3 : (content.startsWith('…') ? 1 : 0);
                    if (dots > 0) {
                        // Remove the continuation character(s). The goal is to be uniform, ie, to use '…' (ellipses) everywhere
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
                            final_minutes += `\n… ${new_content}  `;
                        }
                        else {
                            // For some reasons, there was a previous line
                            // that interrupted the normal flow (eg, setting a new topic), a new
                            // paragraph should be started with the person's name
                            final_minutes += `\n\n**${this.full_name(current_person)}:** ${new_content}  `;
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
                        final_minutes += `\n\n> *${this.full_name(line_object.nick)}:* ${content_with_links}`;
                    }
                }
            }
            else {
                // This is a fall back: somebody (not the scribe) makes a note on IRC
                within_scribed_content = false;
                final_minutes += `\n\n> *${this.full_name(line_object.nick)}:* ${content_with_links}`;
            }
        }
        // ------------------------------  'final_minutes' contains the core minutes by now.
        // Endgame: pulling the TOC, the real minutes and, possibly, the
        // resolutions and actions together
        final_minutes += '\n\n---\n';
        if (rcounter > 1) {
            // There has been at least one resolution
            sec_number_level_1 += 1;
            if (this.kramdown) {
                TOC += `* [${sec_number_level_1}. Resolutions](#res)\n`;
                final_minutes += `\n\n### ${sec_number_level_1}. Resolutions\n{: #res}\n${resolutions}`;
            }
            else {
                TOC += `* [${sec_number_level_1}. Resolutions](#${sec_number_level_1}-resolutions)\n`;
                final_minutes += `\n\n### ${sec_number_level_1}. Resolutions\n${resolutions}`;
            }
        }
        if (acounter > 1) {
            // There has been at least one resolution
            sec_number_level_1 += 1;
            if (this.kramdown) {
                TOC += `* [${sec_number_level_1}. Action Items](#act)\n`;
                final_minutes += `\n\n### ${sec_number_level_1}. Action Items\n{: #act}\n${actions}`;
            }
            else {
                TOC += `* [${sec_number_level_1}. Action Items](#${sec_number_level_1}-action-items)\n`;
                final_minutes += `\n\n### ${sec_number_level_1}. Action Items\n${actions}`;
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
     * @param body - the IRC log; this is either a string or an array of strings (the latter is used when the code is called on the client side).
     */
    convert_to_markdown(body) {
        // An array of lines should be used down from this point.
        const split_body = Array.isArray(body) ? body : body.split(/\n/);
        // 1. cleanup the content, ie, remove the bot commands and the like
        // The lines of text are also converted to LineObject-s on the fly, ie
        // in an array of {nick, content} structures
        const irc_log = utils.cleanup(split_body, this.global);
        // 2. separate the header information
        // eslint-disable-next-line prefer-const
        let { headers, lines } = utils.separate_header(irc_log, this.global.date);
        // 3. Perform changes, ie, execute on requests of the "i/.../..." and "s/.../.../" forms in the log:
        lines = utils.perform_insert_requests(lines);
        lines = utils.perform_change_requests(lines);
        // 4. Store the actions' date, if the separate action list handler is available.
        // (the list of actions is created on the fly...)
        this.global.action_list.set_date(headers.date);
        // 5. Clean up the header by using the real names rather then the nicknames
        headers = this.cleanup_names_in_header(headers);
        // 7. Generate the general header of the minutes
        const preamble = this.generate_preamble(headers);
        // 8. Generate the content part; that also includes the TOC, the list of
        //    resolutions and (if any) of actions
        const content = this.generate_content(lines);
        // 9. Generate the front matter part of the minutes (e.g., whatever is necessary for jekyll to work).
        //    The order is important: the front matter includes the JSON-LD metadata, and that relies on the final
        //    content (e.g., list of actions)
        const front_matter = front_matter_1.generate_front_matter(headers, this.global);
        // 10. Return the concatenation of all constituent parts.
        return front_matter + preamble + content;
    }
}
exports.Converter = Converter;
//# sourceMappingURL=convert.js.map