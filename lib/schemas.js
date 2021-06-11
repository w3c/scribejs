"use strict";
/**
 * ## JSON Schema validation
 *
 * Validating the configuration and nickname files via JSON Schemas, using the external `Ajv` library.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.display_validation_errors = exports.validate_nicknames = exports.validate_config = void 0;
/**
 *
 * Interface to the JSON Schema processor package "ajv". It is used to check
 * the configuration file as well as the nicknames' file.
 *
 * The schemas themselves are part of the distribution as JSON files.
 *
 */
const fs = require("fs");
const AJV = require("ajv");
/** @internal */
function get_schema(file_name) {
    try {
        // This is something ugly: the schema files themselves are in a different relative
        // directory, depending on whether we run it directly from ts-node or from javascript...
        const filename = __filename.includes('src/lib') ? `${__dirname}/../../${file_name}` : `${__dirname}/../${file_name}`;
        const file_c = fs.readFileSync(filename, 'utf-8');
        return JSON.parse(file_c);
    }
    catch (e) {
        console.log(`Scribejs no such configuration file: ${file_name}`);
        return {};
    }
}
/** @internal */
const config_schema = get_schema('schemas/config_schema.json');
/** @internal */
const nicknames_schema = get_schema('schemas/nicknames_schema.json');
/*
* The real interface... creation of a new Ajv object, and then the creation of
* the two separate "validators" for the two schemas.
*
*/
/** @internal */
const validator = new AJV({ allErrors: true });
// I am not sure why this is necessary and not done automatically. Oh well...
// eslint-disable-next-line @typescript-eslint/no-var-requires
// validator.addMetaSchema(require('ajv/lib/refs/json-schema-draft-07.json'));
/**
* Validator objects/function for the configuration file checks
*/
exports.validate_config = validator.compile(config_schema);
/**
* Validator objects/function for the nickname file checks
*/
exports.validate_nicknames = validator.compile(nicknames_schema);
/**
 * Display validation errors. This uses, per the Ajv idiom, one of the validation functions (i.e., [[validate_config]] or [[validate_nicknames]]) after having performed the validation itself.
 *
 *
 * @param validate_function - ajv validation result
 * @return string version of the errors, separated by new line characters.
 */
function display_validation_errors(validate_function) {
    return validator.errorsText(validate_function.errors, { separator: '\n' });
}
exports.display_validation_errors = display_validation_errors;
//# sourceMappingURL=schemas.js.map