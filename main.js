#!/usr/bin/env node
"use strict";
/**
 * ## RSSAgent IRC logs Into Minutes in Markdown
 *
 * @version: 2.0.0
 * @author: Ivan Herman, <ivan@w3.org> (https://www.w3.org/People/Ivan/)
 * @license: W3C Software License <https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const io = require("./lib/io");
const convert = require("./lib/convert");
const conf = require("./lib/conf");
const schemas = require("./lib/schemas");
const rdf = require("./lib/rdf_to_log");
/* This is just the overall driver of the script... */
/**
 * Entry point for the package: read the configuration files, get the IRC logs from the command line, convert and output the result in Markdown.
 *
 * The real work is done in the relevant modules, mostly controlled by an instance of a [[Converter]] class.
 */
async function main() {
    try {
        // Collect and combine the configuration file
        // Note that the get_config method is synchronous
        // (uses a sync version of file system access)
        const config = conf.get_config();
        // Get the nickname mappings object. The result gets added to the configuration
        // config.nicks is of type Nickname[]
        config.nicks = await io.get_nick_mapping(config);
        // Validate the nickname mapping object against the appropriate JSON schema
        const valid = schemas.validate_nicknames(config.nicks);
        if (!valid) {
            console.warn(`Warning: scribejs validation error in nicknames:
                         ${schemas.display_validation_errors(schemas.validate_nicknames)}`);
            console.warn('(nicknames ignored)');
            config.nicks = [];
        }
        // Get the IRC log itself
        let irc_log = await io.get_irc_log(config);
        // If the log is in RDF format of RRSAgent, it is converted to the textual equivalent
        if (config.irc_format === 'rdf') {
            irc_log = await rdf.convert(irc_log);
            delete config.irc_format;
        }
        // const converter: string = new convert.Converter(config).convert_to_markdown(irc_log);
        const minutes = await new convert.Converter(config).convert_to_markdown(irc_log);
        const message = await io.output_minutes(minutes, config);
        // That is it, folks!
        console.log(message);
    }
    catch (err) {
        console.error(`Scribejs: "${err}\n${err.stack}"`);
        process.exit(-1);
    }
}
// Do it!
main();
//# sourceMappingURL=main.js.map