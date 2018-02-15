#!/usr/bin/env node
"use strict";

/**
 *
 * Interface to the JSON Schema processor package "ajv". It is used to check the configuration file as well as the nicknames' file.
 *
 * This file also includes the two schemas themselves as JS Objects; the schemas are not supposed to change often, 
 * i.e., it seemed like an overkill to load those two schemas from external files. This decision may have to be revisited at some point.
 *
 *
 */


/**
* JSON Schema for the configuration file.
*
*/
let config_schema = {
    "title": "Schema for scribejs configuration files",
    "description": "Configuration for scribejs. See https://github.com/w3c/scribejs/blob/master/README.md for details",
    "$schema": "http://json-schema.org/draft-06/schema#",
    "$id": "https://github.com/w3c/scribejs/blob/master/schemas/config_schema.js",
    "type": "object",
    "properties": {
        "date": {
            "title": "Date in ISO Format",
            "description": "Note that the format with date works with the AJV processor, but it is not a mandatory schema item",
            "type": "string",
            "format": "date"
        },
        "group": {
            "title": "Group name, ie, IRC channel without the staring # or & character",
            "description": "Per RFC1459, a channel name cannot use space or comma",
            "type": "string",
            "pattern": "^[^#& ,][^ ,]+$"
        },
        "input": {
            "title": "IRC log; a file name or a URL",
            "type": "string"
        },
        "output": {
            "title": "Output file name",
            "type": "string"
        },
        "nicknames": {
            "title": "Nickname log; a JSON file name or a URL",
            "type": "string"
        },
        "final": {
            "title": "Whether he minutes are final, i.e., they won't be labeled as 'DRAFT'",
            "type": "boolean"
        },
        "torepo": {
            "title": "Whether the output should be stored in a github repository",
            "type": "boolean"
        },
        "pandoc": {
            "title": "Whether the output is meant to be converted further by pandoc",
            "type": "boolean"
        },
        "jekyll": {
            "title": "Whether the output should be adapted to a Github+Jekyll combination",
            "description": "If the value is 'md' or 'kd', a jekyll header is added. If it is 'md', the format is markdown, if it is 'kd', the format is kramdown",
            "type": "string",
            "enum": ["none", "md", "kd"]
        },
        "irc_format": {
            "title": "Whether the input is of the log format of a particular IRC client",
            "description": "'undefined' means the RRSAgent output @W3C. 'Textual' is the only client implemented so far.",
            "type": "string",
            "enum": ["textual", "undefined"]
        },
        "ghrepo": {
            "title": "Github repo name.",
            "type": "string"
        },
        "ghpath": {
            "title": "Github path for the upload of the minutes.",
            "type": "string"
        },
        "ghbranch": {
            "title": "Branch of the repository where the minutes should be stored. If not set, default is used.",
            "type": "string"
        },
        "ghname": {
            "title": "Github login name",
            "type": "string"
        },
        "ghemail": {
            "title": "User's email",
            "$comment": "Note that the format with email works with the AJV processor, but it is not a mandatory schema item",
            "type": "string",
            "format": "email"
        },
        "ghtoken": {
            "title": "User's OAUTH personal access token.",
            "description": "This value should NOT appear in any public configuration file!",
            "type": "string"
        }
    }
}

/**
* JSON Schema for the nicknames' file.
*
*/
let nicknames_schema = {
    "title": "Schema for scribejs nickname files",
    "description": "Nicknames for scibejs. See https://github.com/w3c/scribejs/blob/master/README.md for details",
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
                "title": "Github ID of the person. Currently not really used, could be used later to add links to the minutes.",
                "type": "string"
            }
        },
        "required": [
            "nick", "name"
        ]
    }
}



/**
* The real interface... creation of a new Ajv object, and then the creation of the two separate "validators" for the two schemas.
* 
*/
const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});
// I am not sure why this is necessary and not done automatically. Oh well...
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

/**
* The two validator objects/functions
* 
*/
exports.validate_config = ajv.compile(config_schema);
exports.validate_nicknames = ajv.compile(nicknames_schema);

/**
* This is the ajv idiom for producing a human readable set of error messages...
* The Ajv object is initialized with the option of gathering all errors in one message, so the expected output is a series of errors.
*
*/
exports.validation_errors = (validator) => {
    return ajv.errorsText(validator.errors, {separator: "\n"});
};

