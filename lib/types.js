"use strict";
/* eslint-disable no-multi-spaces */
/**
 * ## Common types and constants
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = exports.debug = void 0;
exports.debug = false;
// eslint-disable-next-line @typescript-eslint/no-namespace
var Constants;
(function (Constants) {
    Constants.JEKYLL_NONE = 'none';
    Constants.JEKYLL_MARKDOWN = 'md';
    Constants.JEKYLL_KRAMDOWN = 'kd';
    Constants.rrsagent_preamble_size = 8 + 1;
    // const rrsagent_regexp = /^[0-9]{2}:[0-9]{2}:[0-9]{2}/;
    Constants.irccloud_preamble_size = 1 + 10 + 1 + 8 + 1 + 1;
    Constants.irccloud_regexp = /^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\]/;
    Constants.textual_preamble_size = 1 + 10 + 1 + 8 + 1 + 4 + 1 + 1;
    Constants.textual_regexp = /^\[[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{4}\]/;
    /** Number of characters added to each line by The Lounge */
    Constants.lounge_preamble_size = 2 + 1 + 2 + 1;
    /** Regex to filter out the preamble of each line in The Lounge */
    Constants.lounge_regexp = /^[0-9]{2}:[0-9]{2} /;
    Constants.issue_regexp = /^@?(scribejs|sjs),\s+(issue|pr)\s+(.*)$/;
    Constants.agenda_regexp = /.* \-\- (.*) \-\-.*/;
    Constants.user_config_name = '.scribejs.json';
    Constants.user_ghid_file = '.credentials.json';
    Constants.text_media_types = [
        'text/plain',
        'application/rdf+xml',
        'application/json',
    ];
    // URL Protocols that are accepted as valid links in the minutes (and are turned into real links).
    Constants.protocols = ['http:', 'https:', 'ftp:', 'mailto:', 'doi:', 'did:'];
    // Parse a github issue/pr URL, and indexes into the regexp result to extract specific data
    Constants.issue_pr_url_regexp = /^(http)([s]*):\/\/github.com\/[-+a-z0-9_.]+\/([-+a-z0-9_.]+)\/(issues|pull)\/([0-9]+)$/i;
    Constants.ip_repo_index = 3;
    Constants.ip_type = 4;
    Constants.ip_issue = 5;
    // Constants to handle slide sets
    Constants.i_slide_code = '<script type="module" src="https://w3c.github.io/i-slide/i-slide-1.js"></script>';
    Constants.i_slide_reference = '<a href="$1#$2"><i-slide src="$3#$4" style="border: 1px solid"></i-slide></a>';
    Constants.slide_regexp = /\[[sS]lide #*([0-9]+)\]/;
    Constants.slide_number_index = 1;
})(Constants = exports.Constants || (exports.Constants = {}));
//# sourceMappingURL=types.js.map