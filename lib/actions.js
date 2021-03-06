"use strict";
/**
 * ## Action management module
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = void 0;
/**
 * Class to encapsulate all methods to handle actions. The public methods are:
 *
 * * set_date
 * * add_action
 *
 * This methods must be called in this order (with, of course, as many `add_action` calls as necessary).
 */
class Actions {
    /**
     * Constructor, retrieving from the configuration the necessary values for actions. The only one that
     * needs explicit call from the generation is the current date (which is to be extracted from the IRC log).
     *
     * @param {Object} conf - scribejs configuration.
     */
    constructor(conf) {
        this.date = '';
        this.url = '';
        this.repo_name = '';
        this.actions = [];
        this.url_pattern = conf.acurlpattern || undefined;
        this.repo_name = conf.acrepo || conf.ghrepo;
        if (this.repo_name && conf.ghname && conf.ghtoken) {
            this.valid = true;
        }
        else {
            console.log('Action setup data missing. Provide acrepo, ghname, and ghtoken');
        }
    }
    /**
     * Set the date of all actions. This method is called by the minute generator once the
     * date has been established (e.g., from a 'date' line in the IRC log). Based on the date, this method
     * sets the value of `this.url`, replacing the patterns in `acurlpattern`, if necessary.
     *
     * @param date - date of the minutes
     */
    set_date(date) {
        this.date = date;
        if (this.url_pattern) {
            const [year, month, day] = date.split('-');
            this.url = this.url_pattern
                .replace(/%YEAR%/g, year)
                .replace(/%MONTH%/g, month)
                .replace(/%DAY%/g, day)
                .replace(/%DATE%/g, date);
        }
    }
    /**
     * Add a new action to the list of actions for these minutes.
     *
     * @param id - the ID of the action (i.e., the fragment ID used in the minutes)
     * @param message - description of the action
     * @param name - the name of the assignee
     * @param assignee - the github id of the assignee
     */
    add_action(id, message, name, assignee) {
        if (this.valid) {
            const gh_action_id = `${this.date}-${id}`;
            const short_message = `${message} (${name})`;
            const full_message = this.url ? `${short_message} ([see details](${this.url}#${id}))` : short_message;
            this.actions.push({
                title: `${gh_action_id}: ${short_message}`,
                body: `${full_message}\n\nCc: @${assignee}`,
                assignee,
            });
        }
    }
}
exports.Actions = Actions;
//# sourceMappingURL=actions.js.map