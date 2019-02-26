#!/usr/bin/env node

'use strict';

/**
 *
 * Interface to the JSON Schema processor package "ajv". It is used to check
 * the configuration file as well as the nicknames' file.
 *
 * The schemas themselves are part of the distribution as JSON files.
 *
 */


const fs  = require('fs');

const get_schema = (fname) => {
    try {
        const filename = `${__dirname}/../${fname}`;
        const file_c = fs.readFileSync(filename, 'utf-8');
        return JSON.parse(file_c);
    } catch (e) {
        console.log(`Scribejs no such configuration file: ${fname}`);
        // process.exit();
        return {};
    }
};

const config_schema    = get_schema('schemas/config_schema.json');
const nicknames_schema = get_schema('schemas/nicknames_schema.json');
const actions_schema   = get_schema('schemas/actions_schema.json');

/*
* The real interface... creation of a new Ajv object, and then the creation of
* the three separate "validators" for the three schemas.
*
*/
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });
// I am not sure why this is necessary and not done automatically. Oh well...
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

/**
* The three validator objects/functions
*
*/
exports.validate_config = ajv.compile(config_schema);
exports.validate_nicknames = ajv.compile(nicknames_schema);
exports.validate_actions = ajv.compile(actions_schema);

/**
 * This is the ajv idiom for producing a human readable set of error messages...
 * The Ajv object is initialized with the option of gathering all errors in one
 * message, so the expected output is a series of errors.
 *
 * @param {object} validator - an ajv validator object (result of compilation)
 * @return {string} - string version of the errors, separated by new line characters.
 *
 */
exports.validation_errors = (validator) => ajv.errorsText(validator.errors, { separator: '\n' });
