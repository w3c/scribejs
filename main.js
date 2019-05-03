#!/usr/bin/env node

'use strict';

/**
 * Convert W3C’s RRSAgent IRC bot output into minutes in Markdown
 *
 * @version: 1.1.0
 * @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
 * @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 */

const debug   = false;
const io          = require('./lib/io');
const convert     = require('./lib/convert');
const conf        = require('./lib/conf');
const { Actions } = require('./lib/actions');

let schemas = {};
try {
    schemas = require('./lib/schemas'); // eslint-disable-line global-require
} catch (err) {
    console.error(`Scribejs ${err}`);
    // process.exit();
}

/* This is just the overall driver of the script... */

async function main() {
    try {
        // Collect and combine the configuration file
        // Note that the get_config method is synchronous
        // (uses a sync version of file system access)
        const config = conf.get_config();
        if (debug) {
            console.log(JSON.stringify(config, null, 2));
        }

        // Get the nickname mappings object. The result gets added to the configuration
        config.nicks = await io.get_nick_mapping(config);

        // Validate the nickname mapping object against the appropriate JSON schema
        const valid = schemas.validate_nicknames(config.nicks);
        if (!valid) {
            console.warn(`Warning: scribejs validation error in nicknames:
                         ${schemas.validation_errors(schemas.validate_nicknames)}`);
            console.warn('(nicknames ignored)');
            config.nicks = [];
        }

        // Set up the action handling
        const actions = new Actions(config);

        // Get the IRC log itself
        const irc_log = await io.get_irc_log(config);

        // The main step: convert the IRC log into a markdown text
        const minutes = convert.to_markdown(irc_log, config, actions);

        // eslint-disable-next-line no-unused-vars
        const [message, dummy] = await Promise.all([io.output_minutes(minutes, config), actions.raise_action_issues()]);

        // That is it, folks!
        console.log(message);
    } catch (err) {
        console.error(`Scribejs: "${err}\n${err.stack}"`);
        process.exit(255);
    }
}

// Do it!
main();
