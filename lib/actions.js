/* eslint-disable no-underscore-dangle */
const Octokat = require('octokat');

class Actions {
    constructor(conf) {
        this._valid = false;
        this._actions = [];
        this._assignees = [];
        this._date = '';
        this._url_pattern = conf.acurlpattern || undefined;
        const repo_name = conf.acrepo || conf.ghrepo;
        if (repo_name && conf.ghname && conf.ghtoken) {
            const github = new Octokat({ token: conf.ghtoken });
            this._repo = github.repos(...repo_name.split('/'));
            // this._repo = github.repos('w3c','json-ld-wg');
            this._valid = true;
        } else {
            console.log('Action setup data missing. Provide acrepo, ghname, and ghtoken');
        }
    }

    /**
     *
     * Get the list of action titles from github; this should be done once to filter
     * out the actions that have already been added.
     *
     * @async
     * @return {Array} - list of action issue titles on the repo.
     */
    async _get_issue_titles() {
        const filter_issue = (issue) => {
            // check if the issue is open
            if (issue.state === 'open' && issue.pullRequest === undefined) {
                // check whether this is indeed an action item!
                return issue.labels.map((label) => label.name).includes('action');
                // return labels.includes('action');
            }
            return false;
        };
        const extract_titles = (open_issues) => {
            return open_issues.items.filter(filter_issue).map((issue) => issue.title);
        };

        // Get the titles of issues already stored.
        // The number of action issues may not be that high, better avoid pagination...
        let issues = await this._repo.issues.fetch({ per_page: 200 });
        let issue_titles = extract_titles(issues);
        // ... but take care of pages nevertheless
        while (issues.nextPage !== undefined) {
            // eslint-disable-next-line no-await-in-loop
            issues = await issues.nextPage.fetch();
            issue_titles = [...issue_titles, ...extract_titles(issues)];
        }
        return issue_titles;
    }

    /**
     *
     * Get the list of possible assignees from github; this is used whether an
     * explicit assignee can be set for an issue or not.
     *
     * @async
     * @return {Array} - list of github id-s of users who can appear as assignees.
     */
    async _get_assignees() {
        // The number of assignees  may not be that high, better avoid pagination...
        let assignee_structures = await this._repo.assignees.fetch({ per_page: 200 });
        let assignees = assignee_structures.items.map((object) => object.login);
        // ... but take care of pages nevertheless
        while (assignee_structures.nextPage !== undefined) {
            // eslint-disable-next-line no-await-in-loop
            assignee_structures = await assignee_structures.nextPage.fetch();
            assignees = [...assignees, ...assignee_structures.items.map((object) => object.login)];
        }
        return assignees;
    }

    /**
     * Retrieve repo data that might be relevant for raising issues.
     *
     * Note that this function belongs, structurally, to the constructor but has to be invoked explicitly. The
     * reason is that this method accesses the github API, and it is better to do that only if there are actions
     * to deal with, ie, at the end of the minute generation process.
     *
     * The method
     * * filters the accumulated actions in `this._actions` to retain only the new one; the results
     * * fills the `this._assignees` array with the github id's of persons who can be assigned an action on an issue
     *
     * @async
     */
    async _retrieve_repo_data() {
        const [titles, assignees] = await Promise.all([this._get_issue_titles(), this._get_assignees()]);

        // filter the accumulated actions
        const action_not_defined = (action) => titles.find((title) => title.startsWith(action.gh_action_id)) === undefined;
        this._actions = this._actions.filter(action_not_defined);
        if (this._actions.length > 0) {
            console.log(`Raising ${this._actions.length} new issue(s) handling actions`);
        } else {
            console.log('No new actions');
        }
        this._assignees = assignees;
    }

    /**
     * Store actions, i.e., raise github issues using the octocat library.
     *
     * @async
     */
    async _store_actions() {
        // Set up an array of Promises to raise actions
        const raised_issues = this._actions.map((action) => {
            const issue = {
                title  : action.title,
                body   : action.body,
                labels : ['action']
            };
            if (action.assignee && this._assignees.includes(action.assignee)) {
                issue.assignees = [action.assignee];
            }
            return this._repo.issues.create(issue);
        });
        await Promise.all(raised_issues);
    }

    // ------------------------ "Public" methods ----------------------------------------

    /**
     * Set the date of all actions. This method is called by the minute generator once the
     * date has been established (e.g., from a 'date' line in the IRC log)
     *
     * @param {String} date - date of the minutes
     */
    set_date(date) {
        this._date = date;
        if (this._url_pattern) {
            const [year, month, day] = date.split('-');
            this._url = this._url_pattern
                .replace('%YEAR%', year)
                .replace('%MONTH%', month)
                .replace('%DAY%', day)
                .replace('%DATE%', date);
        }
    }

    /**
     * Add a new action to the list of actions for these minutes.
     *
     * @param {String} id - the ID of the action (i.e., the fragment ID used in the minutes)
     * @param {String} message - description of the action
     * @param {String} name - the name of the assignee
     * @param {String} assignee - the github id of the assignee
     */
    add_action(id, message, name, assignee) {
        if (this._valid) {
            const gh_action_id = `${this._date}-${id}`;
            const short_message = `${message} (${name})`;
            const full_message = this._url ? `${short_message} ([see details](${this._url}#${id}))` : short_message;
            this._actions.push({
                gh_action_id,
                title : `${gh_action_id}: ${short_message}`,
                body  : `${full_message}\n\nCc: @${assignee}`,
                assignee
            });
        }
    }

    async raise_action_issues() {
        if (this._actions.length !== 0) {
            await this._retrieve_repo_data();
            await this._store_actions();
        } else {
            console.log('No new actions');
        }
    }
}


module.exports = { Actions };
