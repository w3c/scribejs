/* eslint-disable no-underscore-dangle */

'use strict';

/*
*
* TODO:
* - is it necessary to reorganize by pushing the io functions into a separate module?
* - add the new field to the Browserify version, and expand the 'bridge' part to include the action handling
* - create a separate HTML file to properly 'view' the actions
* - documentation
*/

const fs = require('fs');

class ActionList {
    constructor(actions) {
        // Lots of check and further action is needed here!!!
        this._actions = actions;
        this._action_list = this._actions.actions;
        this._action_config = this._actions.config;
        this._url = '';
        this._changed = false;
    }

    get changed() { return this._changed; }

    set_date(date) {
        this.date = date;
        const [year, month, day] = this.date.split('-');
        this._url = this._action_config.url_pattern
            .replace(/%YEAR%/, year)
            .replace(/%MONTH%/, month)
            .replace(/%DAY%/, day)
            .replace(/%DATE%/, this.date);
    }

    add_action(name, action, id) {
        const url = `${this._url}#${id}`;
        const new_action = {
            date : this.date,
            url,
            id,
            action,
            open : true
        };
        if (name in this._action_list) {
            // see if the action has already been recorded
            if (this._action_list[name].find((act) => act.url === url) === undefined) {
                this._action_list[name].push(new_action);
                this._changed = true;
            }
        } else {
            this._action_list[name] = [new_action];
            this._changed = true;
        }
    }

    toString() {
        return JSON.stringify(this._action_list, null, 4);
    }

    toStore() {
        return JSON.stringify(this._actions, null, 4);
    }
}

/**
 * Get the action list (if any). The input provided in the
 * configuration is examined whether it is a URL (in which case this is
 * retrieved via HTTP) or not (in which case it is considered to be a local file).
 * Returns a Promise with the content of the input as an object.
 *
 * @param {object} conf - Overall configuration; the only field that matter here is "conf.nicknames"
 * @returns {Promise} - a promise containing the nicknames as an object parsed from JSON.
 */
function get_action_list(conf) {
    return new Promise((resolve, reject) => {
        if (conf.actions) {
            // This is a local file. Use an async function to retrieve the file,
            // though a sync function would work just as well
            // However if, at some point, remote access is added, then we have the right
            // structure.
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

/**
 * Get the action list (if any). The input provided in the
 * configuration is examined whether it is a URL (in which case this is
 * retrieved via HTTP) or not (in which case it is considered to be a local file).
 * Returns a Promise with the content of the input as an object.
 *
 * @param {object} conf - Overall configuration; the only field that matter here is "conf.actions"
 * @param {ActionList} - the data to be stored
 * @returns {Promise} - a promise returning no value per se
 */
function store_action_list(conf, actions) {
    return new Promise((resolve, reject) => {
        if (conf.actions) {
            // This is a local file. Use an async function to retrieve the file,
            // though, I believe, a sync function would work just as well
            // However if, at some point, remote access is added, then we have the right
            // structure.
            // The action of copying is done via a sync function, though. It is simpler...
            try {
                fs.copyFileSync(conf.actions, `${conf.actions}.bak`);
            } catch (err) {
                reject(new Error(`problem copying local file ${conf.actions} for backup: ${err}`));
            }
            fs.writeFile(conf.actions, actions.toStore(), 'utf-8', (err) => {
                if (err) {
                    reject(new Error(`problem writing local file ${conf.actions}: ${err}`));
                } else {
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}






module.exports = { ActionList, get_action_list, store_action_list };
