/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * ## JSON Schema validation
 *
 * Validating the configuration and nickname files via JSON Schemas, using the external `Ajv` library.
 *
 * @packageDocumentation
*/


/**
 *
 * Interface to the JSON Schema processor package "ajv". It is used to check
 * the configuration file as well as the nicknames' file.
 *
 * The schemas themselves are part of the distribution as JSON files.
 *
 */


import * as fs  from 'fs';

/** @internal */
function get_schema(file_name: string): any {
    try {
        const filename = `${__dirname}/../../${file_name}`;
        const file_c = fs.readFileSync(filename, 'utf-8');
        return JSON.parse(file_c);
    } catch (e) {
        console.log(`Scribejs no such configuration file: ${file_name}`);
        return {};
    }
}

/** @internal */
const config_schema    = get_schema('schemas/config_schema.json');

/** @internal */
const nicknames_schema = get_schema('schemas/nicknames_schema.json');


/*
* The real interface... creation of a new Ajv object, and then the creation of
* the two separate "validators" for the two schemas.
*
*/
/** @internal */
const Ajv = require('ajv');

/** @internal */
const validator = new Ajv({ allErrors: true });
// I am not sure why this is necessary and not done automatically. Oh well...
// eslint-disable-next-line @typescript-eslint/no-var-requires
validator.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

/**
* Validator objects/function for the configuration file checks
*/
export const validate_config    = validator.compile(config_schema);

/**
* Validator objects/function for the nickname file checks
*/
export const validate_nicknames = validator.compile(nicknames_schema);

/**
 * Display validation errors. This uses, per the Ajv idiom, the result of the validation using one of the validation functions, i.e., [[validate_config]] or [[validate_nicknames]].
 *
 *
 * @param validation_result - ajv validation result
 * @return string version of the errors, separated by new line characters.
 */
export function display_validation_errors(validation_result: any): string {
    return validator.errorsText(validation_result.errors, { separator: '\n' });
}
