#!/usr/local/bin/node
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


const request  = protocol.Request();
let   response = protocol.Response(debug);
let   config   = {};

try {
    // 1. Extract the initial config object from the request. The irc_text and file should be treated separately, and the
    // date must be moment object.
    let cgi_config  = _.chain(request.query)
                       .omit((value,key) => key === "irclog_text" || key === "irclog_file")
                       .mapObject((value,key) => key === "date" ? moment(value) : value)
                       .value();
    cgi_config.irclog = request.query.irclog_text && request.query.irclog_text.length > 1 ?
                            request.query.irclog_text : (request.query.irclog_file && request.query.irclog_file.length > 1 ?
                                                            request.query.irclog_file : null);
    config = require("./cgi-conf").get_config(cgi_config, request.script_name);
} catch(err) {
    response.addHeaders(500, {"Content-type" : "text/plain"});
    response.addMessage("Exception occured in the script!\n")
    response.addMessage(err);
    response.flush();
    process.exit(1)
}

// From on, we enter the Promise(d) land:-)
// 2. get the nick names
io.get_nick_mapping(config)
	// 3. get hold of the irc log itself
	.then( (nicknames) => {
		config.nicks = nicknames;
        return io.get_irc_log(config)
	})
    // 4. Convert the irc log into the minutes
    .then( (irc_log) => {
        return convert.to_markdown(irc_log, config);
    })
    // 5. Commit the minutes to github, if required
    .then( (minutes) => {
        if(config.torepo) {
            return io.output_minutes(minutes, config)
        } else {
            return minutes;
        }
    })
    // 6. Either a feedback on the screen, or the full minutes
    .then( (minutes) => {
        response.addMessage(minutes);
        return config;
    })
    .then( (config) => {
        if(debug) {
            response.addMessage("\n# Final configuration ")
            response.addMessage(JSON.stringify(config, null, 2))
        };
        response.addHeaders(200, {
            "Content-Type"          : "text/markdown; charset=utf-8",
            "Content-disposition"   : `inline; filename=${config.ghfname}`
        });
        response.flush();
    })
    .catch( (err) => {
        // The accumulated response should be removed, ie a new response should be created!
        response = protocol.Response(true);
        response.addHeaders(500, {"Content-type" : "text/plain"});
        response.addMessage("Exception occured in the script!\n")
        response.addMessage(err);
        response.flush();
    });
