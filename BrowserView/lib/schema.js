#!/usr/bin/env node

'use strict';

/**
 *
 * Interface to the JSON Schema processor package "ajv". It is used to check
 * the nicknames' file.
 *
 * (This is a somewhat cut-back version of the general 'schemas.js' file that takes the schema from a local file and
 * also checks the configuration file).
 *
 */

// eslint-disable-next-line quotes
const nicknames_schema = JSON.parse(`{
    "title": "Schema for scribejs nickname files",
    "description": "Nicknames for scribejs. See https://github.com/w3c/scribejs/blob/master/README.md for details",
    "$schema": "http://json-schema.org/draft-06/schema#",
    "$id": "https://github.com/w3c/scribejs/blob/master/schemas/nicknames_schema.js",
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "nick": {
                "title": "list of possible nicknames",
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            "name": {
                "title": "Name to be used in the minutes",
                "type": "string"
            },
            "github": {
                "title": "Github ID of the person. Not really used, could be used later to add links to the minutes.",
                "type": "string"
            }
        },
        "required": [
            "nick", "name"
        ]
    }
}`);


/*
* The real interface... creation of a new Ajv object, and then the creation of
* the two separate "validators" for the two schemas.
*
*/
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });
// I am not sure why this is necessary and not done automatically. Oh well...
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

/**
* The two validator objects/functions
*
*/
exports.validate_nicknames = ajv.compile(nicknames_schema);

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
