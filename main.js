'use strict';

/**
* Convert W3C’s RRSAgent IRC bot output into minutes in Markdown
*
* @version: 2.0.0
* @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
* @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
*/

const debug = true;
const port  = 3000;

const express = require('express');

const io      = require('./lib/io');
const convert = require('./lib/convert');
const conf    = require('./lib/conf');

try {
    // Collect and combine the configuration file
    // Note that the get_config method is synchronous
    // (uses a sync version of file system access)
    let config = conf.get_config();

    if (debug) {
        console.log(JSON.stringify(config, null, 2));
    }

    if (config.server) {
        const app = new express();
        app.set('case sensitive routing', true);
        app.set('strict routing', true);
        app.set('view cache', false);
        app.get('*', (req, res) => {
            console.dir(req.query);
            config = conf.get_params(req.query);
            let schemas = {};
            try {
                schemas = require('./lib/schemas'); // eslint-disable-line global-require
            } catch (err) {
                console.error(`Scribejs ${err}`);
            }
            config.nicks = io.get_nick_mapping(config);
            const valid = schemas.validate_nicknames(config.nicks);
            if (!valid) {
                console.warn(`Warning: scribejs validation error in nicknames:\n${schemas.validation_errors(schemas.validate_nicknames)}`);
                console.warn('(nicknames ignored)');
                config.nicks = [];
            }
            const irc_log = io.get_irc_log(config);
            const minutes = convert.to_markdown(irc_log, config);
            const message = io.output_minutes(minutes, config);
            console.log(message);
            res.send(JSON.stringify(config, null, 4));
        });
        app.on('error', (err) => {
            if (err)
                console.error('Error while trying to launch the server: “' + err + '”.');
        });
        app.listen(port);
    } else {

        let schemas = {};

        try {
            schemas = require('./lib/schemas'); // eslint-disable-line global-require
        } catch (err) {
            console.error(`Scribejs ${err}`);
            // process.exit();
        }

        // Get the nickname mappings object. The result gets added to the configuration
        config.nicks = io.get_nick_mapping(config);

        // Validate the nickname mapping object against the appropriate JSON schema
        const valid = schemas.validate_nicknames(config.nicks);
        if (!valid) {
            console.warn(`Warning: scribejs validation error in nicknames:\n${schemas.validation_errors(schemas.validate_nicknames)}`);
            console.warn('(nicknames ignored)');
            config.nicks = [];
        }

        // Get the IRC log itself
        const irc_log = io.get_irc_log(config);

        // The main step: convert the IRC log into a markdown text
        const minutes = convert.to_markdown(irc_log, config);

        // Either upload the minutes to Github or dump into a local file
        const message = io.output_minutes(minutes, config);

        // That is it, folks!
        console.log(message);
    }

} catch (err) {
    console.error(`Scribejs ${err}`);
    process.exit(255);
}
