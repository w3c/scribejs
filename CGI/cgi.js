#!/usr/local/bin/node
"use strict";

/**
 * Convert W3C’s RRSAgent IRC bot output into minutes in Markdown: This is the entry point for a CGI script invocation.
 *
 * @version: 0.9.0
 * @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
 * @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 */

const debug    = false;

const _        = require('underscore');
const moment   = require('moment');
const protocol = require('./protocol');
const io       = require('../io');
const convert  = require('../convert');


// The real conversion of the minutes.
async function get_minutes(config) {
    // Get the nickname mappings object. The result gets added to the configuration
    config.nicks = await io.get_nick_mapping(config);

    // Get the IRC log itself
    let irc_log  = await io.get_irc_log(config);
         
    // The main step: convert the IRC log into a markdown text
    let minutes = convert.to_markdown(irc_log, config);

    // Either upload the minutes to Github or dump into a local file
    let message = "";
    if( config.torepo ) {
        message = await io.output_minutes(minutes, config);
    } else {
        message = minutes;
    }
    return message;
}


// Decode the request data and convert them into a config structure, compatible with the rest of what scribejs does
function get_request_data(request) {
    // Extract the initial config object from the request. The irc_text and file should be treated separately, and the
    // date must be moment object.
    let cgi_config  = _.chain(request.query)
                        .omit((value,key) => key === "irclog_text" || key === "irclog_file")
                        .mapObject((value,key) => key === "date" ? moment(value) : value)
                        .value();

    cgi_config.irclog = request.query.irclog_text && request.query.irclog_text.length > 1 ?
         request.query.irclog_text : (request.query.irclog_file && request.query.irclog_file.length > 1 ?
                                         request.query.irclog_file : null);

    return require("./cgi-conf").get_config(cgi_config, request.script_name);
}


// The main steps
// - get the final configuration
// - convert the input, based on the configuration
// - send back an HTTP response
async function main() {
    const request  = protocol.Request();
    try {
        let config  = get_request_data(request);
        let minutes = await get_minutes(config);

        let response = protocol.Response(debug);        
        response.addMessage(minutes);   
        if(debug) {
            response.addMessage("\n# Final configuration ")
            response.addMessage(JSON.stringify(config, null, 2))
        };
        response.addHeaders(200, {
            "Content-Type"          : "text/markdown; charset=utf-8",
            "Content-disposition"   : `inline; filename=${config.ghfname}`
        });
        response.flush();    
    } catch( err ) {
        let error_response = protocol.Response(true);
        error_response.addHeaders(500, {"Content-type" : "text/plain"});
        error_response.addMessage("Exception occured in the script!\n")
        error_response.addMessage(err);
        error_response.flush();
    }
}

// Do it!
main();
