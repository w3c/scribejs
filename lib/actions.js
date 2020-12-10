"use strict";
/**
 * ## Action management module
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = void 0;
const githubapi_1 = require("./js/githubapi");
/**
 * Class to encapsulate all methods to handle actions. The public methods are:
 *
 * * set_date
 * * add_action
 * * raise_action_issues
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
        this.valid = false;
        this.actions = [];
        this.assignees = [];
        this.date = '';
        this.url = '';
        this.url_pattern = conf.acurlpattern || undefined;
        const repo_name = conf.acrepo || conf.ghrepo;
        if (repo_name && conf.ghname && conf.ghtoken) {
            this.repo = new githubapi_1.GitHub(repo_name, conf);
            this.valid = true;
        }
        else {
            console.log('Action setup data missing. Provide acrepo, ghname, and ghtoken');
        }
    }
    /**
     *
     * Get the list of existing action titles from github; this should be done to filter
     * out the actions that have already been added in a previous run.
     *
     * @return - list of action issue titles on the repo.
     */
    async get_issue_titles() {
        // Get the titles of issues already stored.
        const issue_titles = await this.repo.get_issue_titles();
        return issue_titles;
    }
    /**
     *
     * Get the list of possible assignees from github; this is used to decide whether an
     * explicit assignee can be set for an issue or not.
     *
     * @return - list of github id-s of users who can appear as assignees.
     */
    async get_assignees() {
        const assignees = await this.repo.get_assignees();
        return assignees;
    }
    /**
     * Retrieve repo data that might be relevant for raising issues. This is a call to the
     * `get_issue_titles` and `get_assignees` methods. Also the method:
     *
     * * filters the accumulated actions in `this.actions` to retain only the new ones (to avoid re-assigning an action several times)
     * * fills the `this.assignees` array with the github id's of persons who can be assigned an action on an issue in the first place
     *
     */
    async retrieve_repo_data() {
        const [titles, assignees] = await Promise.all([this.get_issue_titles(), this.get_assignees()]);
        // filter the accumulated actions
        this.actions = this.actions.filter((action) => {
            // see if any of the existing actions matches this one; the match is based on the fact that
            // any action title starts with the id, ie, the date of the call and an internal id of the action
            const found = titles.find((title) => title.startsWith(action.gh_action_id));
            return found === undefined;
        });
        if (this.actions.length > 0) {
            console.log(`Raising ${this.actions.length} new issue(s) handling actions`);
        }
        else {
            console.log('No new actions');
        }
        this.assignees = assignees;
    }
    /**
     * Raise github issues.
     *
     */
    async raise_issues() {
        // Set up an array of Promises to raise actions
        const raised_issues = this.actions.map((action) => {
            const issue = {
                title: action.title,
                body: action.body,
                labels: ['action'],
            };
            if (action.assignee && this.assignees.includes(action.assignee)) {
                issue.assignee = action.assignee;
            }
            return this.repo.create_issue(issue);
        });
        await Promise.all(raised_issues);
    }
    // ------------------------ "Public" methods ----------------------------------------
    /**
     * Set the date of all actions. This method is called by the minute generator once the
     * date has been established (e.g., from a 'date' line in the IRC log). Based on the date, this method
     * also sets the value of `this.url`, replacing the patterns in `acurlpattern`, if necessary.
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
                gh_action_id,
                title: `${gh_action_id}: ${short_message}`,
                body: `${full_message}\n\nCc: @${assignee}`,
                assignee,
            });
        }
    }
    /**
     * Raise all the issues.
     */
    async raise_action_issues() {
        if (this.actions.length !== 0) {
            await this.retrieve_repo_data();
            await this.raise_issues();
        }
        else {
            console.log('No new actions');
        }
    }
}
exports.Actions = Actions;
//# sourceMappingURL=actions.js.map