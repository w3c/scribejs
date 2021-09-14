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
    Constants.issue_regexp = /^@?(scribejs|sjs),\s+(issue|pr)\s+(.*)$/;
    Constants.agenda_regexp = /.* \-\- (.*) \-\-.*/;
    Constants.user_config_name = '.scribejs.json';
    Constants.user_ghid_file = '.credentials.json';
    Constants.text_media_types = [
        'text/plain',
        'application/rdf+xml',
        'application/json',
    ];
})(Constants = exports.Constants || (exports.Constants = {}));
//# sourceMappingURL=types.js.map