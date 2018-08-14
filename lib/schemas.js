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

let pending_config = [];
let pending_nicknames = [];
let pending_validation = [];

let validate_config;
let validate_nicknames;
let validation_errors;

const get_schema = (fname, cb) => {
    fs.readFile(`${__dirname}/../${fname}`, 'utf-8', (err, data) => {
        if (err) {
            console.log(`Scribejs no such configuration file: "${fname}" ("${err}")`);
            cb({});
        } else
            cb(JSON.parse(data));
    });
};

get_schema('schemas/config_schema.json', config_schema => {
    get_schema('schemas/nicknames_schema.json', nicknames_schema => {
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
        validate_config = ajv.compile(config_schema);
        validate_nicknames = ajv.compile(nicknames_schema);

        /**
         * This is the ajv idiom for producing a human readable set of error messages...
         * The Ajv object is initialized with the option of gathering all errors in one
         * message, so the expected output is a series of errors.
         *
         * @param {object} validator - an ajv validator object (result of compilation)
         * @return {string} - string version of the errors, separated by new line characters.
         *
         */
        validation_errors = (validator) => ajv.errorsText(validator.errors,
                                                                  { separator: '\n' });

        if (pending_config.length) {
            console.dir(pending_config);
            for (let i of pending_config)
                i(validate_config);
            pending_config = [];
        }

        if (pending_nicknames.length) {
            for (let i of pending_nicknames)
                i(validate_nicknames);
            pending_nicknames = [];
        }

        if (pending_validation.length) {
            for (let i of pending_validation)
                i.cb(validation_errors(i.validator));
            pending_validation = [];
        }

    });
});

exports.validate_config = (cb) => {
    if (validate_config)
        cb(validate_config);
    else
        pending_config.push(cb);
};

exports.validate_nicknames = (cb) => {
    if (validate_nicknames)
        cb(validate_nicknames);
    else
        pending_nicknames.push(cb);
};

exports.validation_errors = (validator, cb) => {
    if (validation_errors)
        cb(validation_errors(validator));
    else
        pending_validation.push({cb: cb, validator: validator});
};
