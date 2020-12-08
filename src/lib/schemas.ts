/**
 * ## Validating the configuration and nickname files via JSON Schemas
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

const config_schema    = get_schema('schemas/config_schema.json');
const nicknames_schema = get_schema('schemas/nicknames_schema.json');


/*
* The real interface... creation of a new Ajv object, and then the creation of
* the two separate "validators" for the two schemas.
*
*/
const Ajv = require('ajv');

const validator = new Ajv({ allErrors: true });
// I am not sure why this is necessary and not done automatically. Oh well...
// eslint-disable-next-line @typescript-eslint/no-var-requires
validator.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

/**
* The two validator objects/functions
*
*/
export const validate_config    = validator.compile(config_schema);
export const validate_nicknames = validator.compile(nicknames_schema);

/**
 * This is the ajv idiom for producing a human readable set of error messages...
 * The Ajv object is initialized with the option of gathering all errors in one
 * message, so the expected output is a series of errors.
 *
 * (Note: the type information of the argument is `any`, because Typescript processing somehow got things wrong otherwise...)
 *
 * @param validator_function - an ajv validator object (result of compilation)
 * @return string version of the errors, separated by new line characters.
 *
 */
export function validation_errors(validator_function: any): string {
    return validator.errorsText(validator_function.errors, { separator: '\n' });
}
