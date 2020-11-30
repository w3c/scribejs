/* eslint-disable no-multi-spaces */
/**
 * ## Common types
 *
 * @packageDocumentation
*/
import moment from 'moment';

export const JEKYLL_NONE        = 'none';
export const JEKYLL_MARKDOWN    = 'md';
export const JEKYLL_KRAMDOWN    = 'kd';


/**
 * All the configuration variables that can also appear in configuration files.
 *
 */
export interface Configuration {
    /** Date in ISO format */
    date?:          string | moment.Moment;

    /** Group name, ie, IRC channel without the staring # or & character */
    group?:         string;

    /** IRC log; a file name or a URL */
    input?:         string;

    /** Output file name */
    output?:        string;

    /** Nickname log; a JSON file name or a URL */
    nicknames?:     string;

    /** Whether he minutes are final, i.e., they won't be labeled as 'DRAFT' */
    final?:         boolean;

    /** Whether the draft label is to be generated automatically into the minutes via a separate script. */
    auto?:          boolean;

    /** Whether the output should be stored in a github repository */
    torepo?:        boolean;

    /** Whether the output is meant to be converted further by pandoc */
    pandoc?:        boolean;

    /** Whether the output should be adapted to a Github+Jekyll combination. Values may be 'none', 'md', or 'kd' */
    jekyll?:        string;

    /**
     * Whether the input is of the log format of a particular IRC client.
     *
     * If missing, the format is the RRSAgent output @W3C. 'Textual' is the only other client format implemented so far.
     */
    irc_format?:    string;

    /** Github repo name. */
    ghrepo?:        string;

    /** Github path for the upload of the minutes. */
    ghpath?:        string;

    /** Branch of the repository where the minutes should be stored. If not set, default is used. */
    ghbranch?:      string;

    /** Github repo name for action issues. */
    acrepo?:        string;

    /** (Default) github repo for the issues that are discussed on the call. */
    issuerepo?:     string;

    /** URL pattern used to refer the minutes. */
    acurlpattern?:  string;

    /** Github user's login name */
    ghname?:        string;

    /** Github user's email address */
    ghemail?:       string;

    /**
     * User's OAUTH personal access token.
     *
     * This value should _NOT_ appear in any public configuration file or in the code!
     */
    ghtoken?:       string;

    /**
     * File name to be used if the script uploads the minutes directly to Github. Defaults to the
     * output setting of the user.
     */
    ghfname?:       string;

    /**
     * IRC log contained in the structure verbatim; this is when the script runs on the client side
     */
    irclog?:        string;
}

/**
 * Global data, which includes the data in the Configuration but also variables that are set by the process run-time
 *
 */

export interface Global extends Configuration {
    /**
     * Message to be used if the script uploads the minutes directly to Github. This is a fixed text
     * at the moment, generated with the right date and generation time.
     */
    ghmessage?:     string;

    /**
     * Original URL for the IRC log, stored run-time
     */
    orig_irc_log?:  string;

    /**
     * List of all the nicknames as retrieved from the nickname file.
     *
     * Note: this variable is set run-time, not via the configuration file
     */
    nicks?:         Nickname[];

    /**
     * Mapping from names to a Nickname structure
     */
    nick_mappings?: NicknameMapping;
}


export interface Nickname {
    /** List of possible nicknames. */
    nick:       string[];

    /** Name to be used in the minutes. */
    name:       string;

    /**
     * Github ID of the person.
     *
     * Currently not really used, could be used later to add links to the minutes.
     */
    github?:    string;

    /** Particular role of the person: chair, staff contact, editor. */
    role?:      string;

    /** URL of the person (currently not used, maybe in a future version) */
    url?:       string;
}

export interface NicknameMapping {
    [index: string]:    Nickname;
}

export interface Header {
    /** Title of the meeting */
    meeting:    string;

    /** URL of the agenda */
    agenda:     string;

    /** Date of the meeting */
    date:       string;

    /** Names of chairs */
    chair:      string[];

    /** Names of all present */
    present:    string[];

    /** Names of persons having sent regrets */
    regrets:    string[];

    /** Names of guests */
    guests:     string[];

    /** Names of scribes */
    scribe:     string[];
}

export interface DisplayHeader {
    /** Title of the meeting */
    meeting:    string;

    /** URL of the agenda */
    agenda:     string;

    /** Date of the meeting */
    date:       string;

    /** Names of chairs as a comma separated list */
    chair:      string;

    /** Names of all present as a comma separated list */
    present:    string;

    /** Names of persons having sent regrets as a comma separated list */
    regrets:    string;

    /** Names of guests  as a comma separated list */
    guests:     string;

    /** Names of scribes as a comma separated list */
    scribe:     string;
}
