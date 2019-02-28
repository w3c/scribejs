#!/usr/bin/env node

'use strict';

/**
 * Convert W3C’s RRSAgent IRC bot output into minutes in Markdown
 *
 * @version: 1.2.0
 * @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
 * @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 */

const debug   = false;
const io      = require('./lib/io');
const convert = require('./lib/convert');
const conf    = require('./lib/conf');
const { ActionList, get_action_list, store_action_list } = require('./lib/actions');

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
            console.warn(`Warning: scribejs validation error in nicknames: ${schemas.validation_errors(schemas.validate_nicknames)}`);
            console.warn('(nicknames ignored)');
            config.nicks = [];
        }

        // Get the action list, if set
        // eslint-disable-next-line no-undef-init
        let actions = undefined;
        if (config.actions) {
            const current_action_list = await get_action_list(config);
            // console.log(JSON.stringify(current_action_list,null,4));
            const valid_act = schemas.validate_actions(current_action_list);
            if (!valid_act) {
                console.warn(`Warning: scribejs validation error in the action list: ${schemas.validation_errors(schemas.validate_actions)}`);
                console.warn('(action list ignored)');
            } else {
                actions = new ActionList(current_action_list);
            }
        }

        // Get the IRC log itself
        const irc_log = await io.get_irc_log(config);

        // The main step: convert the IRC log into a markdown text
        const minutes = convert.to_markdown(irc_log, config, actions);

        // Either upload the minutes to Github or dump into a local file
        const message = await io.output_minutes(minutes, config);

        if (actions !== undefined && actions.changed) {
            console.log('Writing action list');
            await store_action_list(config, actions);
        } else {
            console.log('No change in actions');
        }

        // That is it, folks!
        console.log(message);
    } catch (err) {
        console.error(`Scribejs ${err}`);
        process.exit(255);
    }
}

// Do it!
main();
