#!/usr/local/bin/node
/**
 * Convert W3C’s RRSAgent IRC bot output into minutes in Markdown
 *
 * A mini version of a generic CGI interface.
 *
 * @version: 0.9.0
 * @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
 * @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 */

const _           = require('underscore');
const http        = require('http');
const querystring = require('querystring');
const fs          = require('fs');

/**
 * Generic entry for a CGI request.
 *
 * It returns an object that includes some key/value pairs that might be useful for a CGI processing, namely `host`, `root`,
 * `script_name`, `request_method`. Additionally, the object also includes the `query` field which is created as follows:
 *
 * - For a GET request this is straightforward conversion of the query URL keys and values.
 * - For a PUT request, this contains uploaded text data as *arrays of strings* (ie, this is NOT prepared for
 *   non-textual data!), and straighforward key/value pairs for values that are a single string. Also, the values of
 *   "true" and "false" are converted into booleans on the fly.
 *
 * @returns {object} - essential request data
 */
exports.Request = function() {
    let extract_query = function() {
        if(process.env["REQUEST_METHOD"] === undefined) return {}

        if(process.env["REQUEST_METHOD"] === "GET") {
            return _.omit(process.env["QUERY_STRING"] ? querystring.parse(process.env["QUERY_STRING"]) : "{}",
                          (value,key) => value === "")
        } else {
            /* This is much more complicated... the POST message has to be decoded. */
            // 1. find the separator string
            // The definition of the boundary regexp relies on https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
            let separator = process.env["CONTENT_TYPE"].match(/boundary=([A-Za-z0-9_'\(\)+,-\.\/:=?]*)/)[1]
            // 2. The post data is in the standard input; the data is broken into individual lines
            let post_data = fs.readFileSync('/dev/stdin').toString().split("\n");
            // 3. The multipart data must be broken into individual components
            let retval       = {};
            let current_key  = null;
            let in_header    = false;
            _.forEach(post_data, (line) => {
                if(line.includes(separator)) {
                    // a new part is being collected
                    current_key  = null;
                    in_header    = true;
                } else {
                    if(in_header) {
                        if(line.match(/^[\r\n]/) !== null) {
                            // This is an empty line in the header; after this,
                            // we are in the real content_type
                            in_header = false;
                        } else {
                            let is_name = line.match(/name=\"(\w*)\"/)
                            if(is_name != null) {
                                current_key = is_name[1];
                                retval[current_key] = [];
                            }
                        }
                    } else {
                        if( current_key != null )
                            retval[current_key].push(line.trim())
                    }
                }
            })
            // 4. Clean up the information: if there is only one element in an array, then it should be a value;
            // if that element is an empty line, the key should not be added at all.
            return _.chain(retval)
                .mapObject( (value,key) => value.length > 1 ? value : value[0] )
                .mapObject( (value,key) => value === "true" ? true : (value === "false" ? false : value))
                .omit( (value,key) => value === "" )
                .value()
        }
    };

    return {
        query          : extract_query(),
        host           : process.env["HTTP_HOST"],
        root           : process.env["DOCUMENT_ROOT"],
        script_name    : process.env["SCRIPT_FILENAME"],
        request_method : process.env["REQUEST_METHOD"]
    }
}

/**
 * Object to handle response data and actions for CGI scripts.
 *
 * @param {boolean} debug - whether a default debug should be added to the response
 * @returns {object} - Response object.
 */
exports.Response = function(debug = false) {
    return {
        head : null,
        body : "",

        /**
         * Add the headers.
         *
         * @param {int} status - HTTP response code. Defaults to 200
         * @param {object} headers - HTTP headers. Defaults to a content type set to `text/markdown`
         * @param {string} reason - response string added to the response code. Defaults to the string as defined in the HTTP spec.
         */
        addHeaders : function(status = 200, headers = {"Content-Type":"text/markdown; charset=utf-8"}, reason = undefined ) {
            if(reason === undefined) {
                reason = http.STATUS_CODES[status] || 'unknown';
            }

            this.head = `Status: ${status} ${reason}\n`;

            _.forEach(headers, (value, key) => {
                this.head += `${key}: ${value}\n`
            });
            this.head += "\n"
        },

        /**
         * Add a message to the body
         *
         * @param {string} message - string to be added to the response body.
         * @param {boolean} nl - whether to add a new line to the message. Defaults to 'true'
         */
        addMessage : function(message, nl = true) {
            this.body += message;
            if(nl) {
                this.body += "\n"
            }
        },

        /**
         * Add the default debug output to the messaga: a list of the environment variables of the script (in markdown syntax)
         */
        debug_output : function() {
            this.addMessage("\n# Environment variables\n");
            _.forEach(process.env, (value,key) => {
                if( !key.includes("TERM") ) {
                    this.addMessage(`* **${key}**: ${value}`);
                }
            });
        },

        /**
         * Flush the header and the full body to standard output.
         */
        flush : function() {
            if(this.head === null) {
                this.addHeaders();
            }
            process.stdout.write(this.head);
            if(debug) {
                this.debug_output();
            }
            process.stdout.write(this.body);
        }
    }
}
