'use strict';

/*
* TODO:
* - check whether the action has already been recorded
* - store the action list in the original file
* - add the new field to the Browserify version, and expand the 'bridge' part to include the action handling
* - create a separate HTML file to properly 'view' the actions
* - documentation
*/

const fs     = require('fs');


class ActionList {
    constructor(actions) {
        // Lots of check and further action is needed here!!!
        this.actions = actions;
        this.action_list = this.actions.actions;
        this.action_config = this.actions.config;
    }

    set_date(date) {
        this.date = date;
        const [year, month, day] = this.date.split('-');
        this.url = this.action_config.url_pattern
            .replace(/%YEAR%/, year)
            .replace(/%MONTH%/, month)
            .replace(/%DAY%/, day)
            .replace(/%DATE%/, this.date);
    }

    add_action(name, action, id) {
        const new_action = {
            date : this.date,
            url  : `${this.url}#${id}`,
            id,
            action,
            open : true
        };
        if (name in this.action_list) {
            this.action_list[name].push(new_action);
        } else {
            this.action_list[name] = [new_action];
        }
    }

    toString() {
        return JSON.stringify(this.action_list, null, 4);
    }
}

/**
 * Get the action list (if any). The input provided in the
 * configuration is examined whether it is a URL (in which case this is
 * retrieved via HTTP) or not (in which case it is considered to be a local file).
 * Returns a Promise with the content of the input as an object.
 *
 * @param {object} conf - Overall configuration; the only field that matter
 *     here is "conf.nicknames"
 * @returns {Promise} - a promise containing the nicknames as an object parsed from JSON.
 */
function get_action_list(conf) {
    /**
    * Minimal cleanup on nicknames: allow irc log to be lower or upper case,
    * internal comparisons should use the lower case only
    */
    return new Promise((resolve, reject) => {
        if (conf.actions) {
            // This is a local file. Use an async function to retrieve the file,
            // though, I believe, a sync function would work just as well
            fs.readFile(conf.actions, 'utf-8', (err, body) => {
                if (err) {
                    reject(new Error(`problem accessing local file ${conf.actions}: ${err}`));
                } else {
                    // Try to parse the content as JSON and, if it works, that is almost
                    // the final result, module turn all the nicknames to lowercase
                    let json_content = {};
                    try {
                        json_content = JSON.parse(body);
                    } catch (parse_err) {
                        throw new Error(`JSON parsing error in ${conf.actions}: ${parse_err}`);
                    }
                    resolve(json_content);
                }
            });
        } else {
            resolve({});
        }
    });
}







module.exports = { ActionList, get_action_list };
