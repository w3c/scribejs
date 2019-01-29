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


const nicknames_schema = require('../../schemas/nicknames_schema.json');

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
