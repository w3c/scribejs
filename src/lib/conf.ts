/**
 * ## Retrieving the configuration files and merge them into the final configuration structure
 *
 * @packageDocumentation
*/

/**
* Get the arguments and/or configuration file
*/
import * as fs                              from 'fs';
import * as path                            from 'path';
import { Command }                          from 'commander';
import * as schemas                         from './schemas';
import * as utils                           from './utils';
import { Configuration, Global, Constants } from './types';

/** Initial value for the final configuration. The values are overwritten by other possible configuration files and command line arguments. */
const default_config: Global = {
    date          : utils.today,
    final         : false,
    torepo        : false,
    jekyll        : Constants.JEKYLL_NONE,
    pandoc        : false,
    irc_format    : undefined,
    schema        : true,
    nick_mappings : {},
};

/**
* Read a configuration file and generate the final combination.
*
* The full configuration file may have optional parts for extra calls and may also be used to refer to "local" (as opposed to be on the Web) versions
* of such files like the nickname collection. The function access the full configuration file and generates a version based on the core values, possibly modified
* by the information in the optional parts.
*
* @param file_name - file name
* @param group - group name (necessary if the call is an extra call rather than the 'base' one)
* @param local - whether certain files are to be extracted from the local repository (as opposed to be retrieved from github)
* @param warn - whether an error should be raised when the file is
*     not found (e.g., a user level configuration file may be missing)
* @returns the parsed JSON content
* @throws - either not-found error, or schema validation errors
*/
function json_conf_file(file_name: string, group: string, local: boolean, warn = true): Configuration {
    let file_c = null;
    try {
        file_c = fs.readFileSync(file_name, 'utf-8');
        let js_conf = JSON.parse(file_c);

        const valid = schemas.validate_config(js_conf);
        if (!valid) {
            console.warn(`Warning: validation error in the ${file_name} configuration file:
                        ${schemas.display_validation_errors(schemas.validate_config)}`);
            console.warn('(default, minimal configuration used.)');
            return default_config;
        } else {
            if (local && js_conf.local) {
                js_conf = {...js_conf, ...js_conf.local}
            }

            if (js_conf.extra_calls && js_conf.extra_calls[group]) {
                js_conf = {...js_conf, ...js_conf.extra_calls[group]}
            }

            // Clean the result to avoid confusion with debugging later:
            if (js_conf.extra_calls) delete js_conf.extra_calls;
            if (js_conf.local) delete js_conf.local;

            return js_conf as Configuration;
        }
    } catch (e) {
        if (warn) throw new Error(`Problem with the configuration file: ${file_name} (${e})!`);
        return {};
    }
}


/**
 * Return the URL to the input: the RSS IRC script URL on the HTTP Date space, namely
 *  `https://www.w3.org/{year}/{month}/{day}-{wg}-irc.txt`. All date values are zero padded.
 *
 * @param date
 * @param wg - the name of the wg/ig used when RRSAgent generates the IRC log
 */
function set_input_url(date: string, wg: string) {
    const [year, month, day] = date.split('-');
    return `https://www.w3.org/${year}/${month}/${day}-${wg}-irc.txt`;
}

/**
 * Collect the full configuration information. This is a combination of four possible sources
 * of increasing priority
 *
 * - default configuration (contains empty fields except for the date which set to 'today')
 * - user ghid file, ie, `~/.ghid.json`
 * - user configuration, ie, `~/.scribejs.json`
 * - configuration file provided via the command line
 * - additional configuration options in the command line
 *
 * @returns - full configuration. See the definition of [[Configuration]] as well as the readme file for details.
 */
export function get_config(): Global {
    /** ******************************************************************** */
    // First step: get the command line arguments. There is an error handling for undefined options
    const program = new Command();
    const argument_config: Configuration = {};
    program
        .name('scribejs')
        .description('Converting RSSAgent IRC logs into minutes in markdown.')
        .usage('[options] [file]')
        .option('-d, --date [date]', 'date of the meeting in ISO (i.e., YYYY-MM-DD) format')
        .option('-r, --repo', 'whether the output should be stored in a github repository')
        .option('-f, --final', 'whether the minutes are final, i.e., not a draft')
        .option('-l, --local', 'whether the nickname file should be accessed locally or via a fetch on github')
        .option('-a, --auto', 'whether the draft label is to be generated automatically into the minutes via a separate script')
        .option('-g, --group [group]', 'name of the IRC channel used by the group')
        .option('-c, --config [config]', 'JSON configuration file')
        .option('-n, --nick [nicknames]', 'JSON file for nickname mappings')
        .option('-o, --output [output]', 'output file name')
        .option('-j, --jekyll [option]', 'whether the output should be adapted to Github+Jekyll;'
                                         + ' values can be "none", "md", or "kd"')
        .option('-p, --pandoc', 'whether the output is meant for a pandoc conversion input')
        .option('-i, --irc [format string]', 'use the RRSAgent rdf format, or an input format of a specific irc client\'s log,'
                                             + ' rather than the default RRSAgent log')
        .on('--help', () => {
            console.log('  file:                      irc log file; if not present, retrieved from the W3C site');
        })
        .parse(process.argv);

    if (program.repo) argument_config.torepo = true;
    if (program.final) argument_config.final = true;
    if (program.auto) argument_config.auto = true;
    if (program.pandoc) argument_config.pandoc = true;
    if (program.jekyll) {
        argument_config.jekyll = ([Constants.JEKYLL_KRAMDOWN, Constants.JEKYLL_MARKDOWN].includes(program.jekyll)
            ? program.jekyll
            : Constants.JEKYLL_NONE);
    }
    if (program.date) argument_config.date = program.date;
    if (program.group) argument_config.group = program.group;
    if (program.output) argument_config.output = program.output;
    if (program.nick) argument_config.nicknames = program.nick;
    if (program.irc) argument_config.irc_format = program.irc;
    if (program.args) argument_config.input = program.args[0];

    const local = program.local ? true : false ;

    /** ******************************************************************** */
    // Second step: see if there is an explicit config file to be retrieved
    const file_config = program.config ? json_conf_file(program.config, program.group, local) : {};

    /** ******************************************************************** */
    // Third step: see if there is user ghid file file
    const gh_id = (process.env.HOME)
        ? json_conf_file(path.join(process.env.HOME, Constants.user_ghid_file), program.group, local, false)
        : {};

    /** ******************************************************************** */
    // Fourth step: see if there is user level config file
    const user_config = (process.env.HOME)
        ? json_conf_file(path.join(process.env.HOME, Constants.user_config_name), program.group, local, false)
        : {};

    /** ******************************************************************** */
    // Fifth step: combine the configuration in increasing priority order, yielding the raw return value
    // const retval = _.extend(default_config, gh_id, user_config, file_config, argument_config) as Global;
    const retval = {...default_config, ...gh_id, ...user_config, ...file_config, ...argument_config} as Global;
    /** ******************************************************************** */
    // Sixth step: sanity check and some cleanup on the configuration object

    // 1. If the group is provided and no explicit input, we should retrieve the
    // IRC log from the W3C site
    // Note, however, if the group is set, the IRC URL is to be set in any case,
    // because that is the original one stored on the Web site,
    // ie, that must be referred to in the header of the minutes
    if (retval.group) {
        // Set the default IRC URL
        retval.orig_irc_log = set_input_url(retval.date, retval.group);
        if (!retval.input) {
            retval.input = retval.orig_irc_log;
        }
    }

    // 2. if the input is not set, nothing should happen!
    if (!retval.input) {
        // There is nothing to do!!
        throw new Error('no irc log is provided; either an explicit file name or date and group name are needed');
    }

    // 3. if the github repo should be used, some values are required. If they are
    // present, the output file name for the repo can be generated, if needed
    if (retval.torepo) {
        const needed = [retval.ghname, retval.ghemail, retval.ghtoken, retval.ghrepo, retval.ghpath];
        if (utils.every(needed, (val) => val !== undefined)) {
            retval.ghfname = retval.output ? retval.output : `${retval.date}-minutes.md`;
            retval.ghmessage = `Added minutes for ${retval.date} at ${new Date().toISOString()}`;
        } else {
            const message = 'Repository output is required, but not all values are provided.\n';
            const message2 = 'are needed: ghname, ghemail, ghtoken, ghrepo, ghpath\n';
            if (retval.ghtoken !== undefined) retval.ghtoken = '(hidden)';
            if (retval.ghemail !== undefined) retval.ghemail = '(hidden)';
            if (retval.ghname !== undefined) retval.ghname = '(hidden)';
            throw new Error(message + message2 + JSON.stringify(retval, null, 2));
        }
    }

    // 4. the 'auto' value is set automatically in case the configuration file does not set it explicitly
    if (!retval.auto) {
        retval.auto = !(retval.final === true);
    }

    return retval;
}
