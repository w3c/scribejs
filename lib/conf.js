'use strict';

/**
* Get the arguments and/or configuration file
*/
const _                   = require('underscore');
const moment              = require('moment');
const fs                  = require('fs');
const path                = require('path');
const program             = require('commander');
const schemas             = require('./schemas');

const user_config_name    = '.scribejs.json';

const JEKYLL_NONE        = 'none';
const JEKYLL_MARKDOWN    = 'md';
const JEKYLL_KRAMDOWN    = 'kd';

const default_config = {
    date          : moment(),
    final         : false,
    torepo        : false,
    jekyll        : JEKYLL_NONE,
    pandoc        : true,
    nick_mappings : [],
    irc_format    : undefined
};

/**
* Read a configuration file
*
* @param {string} fname - file name
* @param {boolean} warn - whether an error should be raised when the file is
*     not found (e.g., a user level configuration file may be missing)
* @returns {object} - the parsed JSON content
* @throws {string} - either not-found error, or schema validation errors
*/
exports.json_conf_file = (fname, warn) => {
    let file_c = null;
    try {
        file_c = fs.readFileSync(fname, 'utf-8');
    } catch (e) {
        if (warn) throw new Error(`No such configuration file: ${fname}!`);
        return {};
    }

    // The validation error may throw an exception; in "main.js" this leads to program termination.
    // The JSON content is first checked with the schema; once done and successful
    // the date value is converted into a 'moment' instance right away.
    const jconf = JSON.parse(file_c);
    const valid = schemas.validate_config(jconf);
    if (!valid) {
        console.warn(`Warning: validation error in the ${fname} configuration file:
                     ${schemas.validation_errors(schemas.validate_config)}`);
        console.warn('(default, minimal configuration used.)');
        return default_config;
    }
    return _.mapObject(jconf, (value, key) => (key === 'date' ? moment(value) : value));
};

/**
 * Return the URL to the input: the RSS IRC script URL on the HTTP Date space, namely
 *  https://www.w3.org/{year}/{month}/{day}-{wg}-irc.txt. The all date values are zero padded.
 *
 * @param {moment} date
 * @param {string} wg - the name of the wg/ig used when RRSAgent generates the IRC log
 */
exports.set_input_url = (date, wg) => {
    const zeropadding = (n) => (n < 10 ? `0${n}` : `${n}`);
    const month = zeropadding(date.month() + 1);
    const day   = zeropadding(date.date());
    return `https://www.w3.org/${date.year()}/${month}/${day}-${wg}-irc.txt`;
};

/**
 * Collect the full configuration information. This is a combination of four possible sources
 * of increasing priority
 * - default configuration (contains empty fields except for the date which set to 'today')
 * - user configuration, ie, ~/.scribejs.json
 * - configuration file provided via the command line
 * - additional configuration options in the command line
 *
 * @returns {object} - full configuration. See the overall manual for the field definitions
 */
exports.get_config = () => {
    /** ******************************************************************** */
    // First step: get the command line arguments. There is an error handling for undefined options
    const argument_config = {};
    program
        .usage('[options] [file]')
        .option('-d, --date [date]', 'date of the meeting in ISO (i.e., YYYY-MM-DD) format')
        .option('-r, --repo', 'whether the output should be stored in a github repository')
        .option('-f, --final', 'whether the minutes are final, i.e., not a draft')
        .option('-a, --auto', 'whether the draft label is to be generated automatically into the minutes via a separate script')
        .option('-g, --group [group]', 'name of the IRC channel used by the group')
        .option('-c, --config [config]', 'JSON configuration file')
        .option('-n, --nick [nicknames]', 'JSON file for nickname mappings')
        .option('-o, --output [output]', 'output file name')
        .option('-j, --jekyll [option]', 'whether the output should be adapted to Github+Jekyll;'
                                         + ' values can be "none", "md", or "kd"')
        .option('-p, --pandoc', 'whether the output is meant for a pandoc conversion input')
        .option('-i, --irc [format string]', "use an input format of a specific irc client's log,"
                                             + 'rather than the default RRSAgent log')
        .on('--help', () => {
            console.log('    file:                   irc log file; if not present, retrieved from the W3C site');
        })
        .parse(process.argv);

    // TODO: lots of whitespace https://eslint.org/docs/rules/no-multi-spaces
    // TODO: consider setting defaults for all configs instead
    if (program.repo) argument_config.torepo = true;
    if (program.final) argument_config.final = true;
    if (program.auto) argument_config.auto = true;
    if (program.textual) argument_config.textual = true;
    if (program.pandoc) argument_config.pandoc = true;
    if (program.jekyll) {
        argument_config.jekyll = ([JEKYLL_KRAMDOWN, JEKYLL_MARKDOWN].includes(program.jekyll)
            ? program.jekyll
            : JEKYLL_NONE);
    }
    if (program.date) argument_config.date = moment(program.date);
    if (program.group) argument_config.group = program.group;
    if (program.output) argument_config.output = program.output;
    if (program.nick) argument_config.nicknames = program.nick;
    if (program.irc) argument_config.irc_format = program.irc;
    if (program.args) argument_config.input = program.args[0];

    /** ******************************************************************** */
    // Second step: see if there is an explicit config file to be retrieved
    const file_config = program.config ? exports.json_conf_file(program.config, true) : {};

    /** ******************************************************************** */
    // Third step: see if there is user level config file
    const user_config = (process.env.HOME)
        ? exports.json_conf_file(path.join(process.env.HOME, user_config_name), false)
        : {};

    /** ******************************************************************** */
    // Fourth step: combine the configuration in increasing priority order
    const retval = _.extend(default_config, user_config, file_config, argument_config);

    /** ******************************************************************** */
    // Fifths step: sanity check and some cleanup on the configuration object

    // 1. If the group is provided and no explicit input, we should retrieve the
    // IRC log from the W3C site
    // Note, however, if the group is set, the IRC URL is to be set in any case,
    // because that is the original one stored on the Web site,
    // ie, that must be referred to in the header of the minutes
    if (retval.group) {
        // Set the default IRC URL
        retval.orig_irc_log = exports.set_input_url(retval.date, retval.group);
        if (!retval.input) {
            retval.input = retval.orig_irc_log;
        }
    }

    // 2. get read of the 'moment' object and use ISO date instead
    retval.date = retval.date.format('YYYY-MM-DD');

    // 3. if the input is not set, nothing should happen!
    if (!retval.input) {
        // There is nothing to do!!
        throw new Error('no irc log is provided; either an explicit file name or date and group name are needed');
    }

    // 4. if the github repo should be used, some values are required. If they are
    // present, the output file name for the repo can be generated, if needed
    if (retval.torepo) {
        const needed = [retval.ghname, retval.ghemail, retval.ghtoken, retval.ghrepo, retval.ghpath];
        if (_.every(needed, (val) => !_.isUndefined(val))) {
            retval.ghfname = retval.output ? retval.output : `${retval.date}-minutes.md`;
            retval.ghmessage = `Added minutes for ${retval.date} at ${moment().format('YYYY-MM-DD H:m:s Z')}`;
        } else {
            const message = 'repository output is required, but not all values are provided.\n';
            const message2 = 'are needed: ghname, ghemail, ghtoken, ghrepo, ghpath\n';
            if (retval.ghtoken !== undefined) retval.ghtoken = '(hidden)';
            if (retval.ghemail !== undefined) retval.ghemail = '(hidden)';
            if (retval.ghname !== undefined) retval.ghname = '(hidden)';
            throw new Error(message + message2 + JSON.stringify(retval, null, 2));
        }
    }

    // 5. the 'auto' value is set automatically in case the configuration file does not set it explicitly
    if (!retval.auto) {
        retval.auto = !(retval.final === true);
    }

    return retval;
};
