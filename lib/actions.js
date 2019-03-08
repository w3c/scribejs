/* eslint-disable no-underscore-dangle */
const Octokat = require('octokat');

class Actions {
    constructor(conf) {
        this._valid = false;
        this._actions = [];
        this._date = '';
        this._urlpattern = conf.acurlpattern || undefined;
        const reponame = conf.acrepo || conf.ghrepo;
        if (reponame && conf.ghname && conf.ghtoken) {
            this._acrepo = reponame.split('/');
            this._ghname = conf.ghname;
            this._github = new Octokat({ token: conf.ghtoken });
            this._valid = true;
        } else {
            console.log('Action setup data missing. Provide acrepo, ghname, and ghtoken');
        }
    }

    /**
     * Set the date of all actions. This method is called by the minute generator once the
     * date has been established (e.g., from a 'date' line in the IRC log)
     *
     * @param {String} date - date of the minutes
     */
    set_date(date) {
        this._date = date;
        if (this._urlpattern) {
            const [year, month, day] = date.split('-');
            this._url = this._urlpattern
                .replace('%YEAR%', year)
                .replace('%MONTH%', month)
                .replace('%DAY%', day)
                .replace('%DATE%', date);
        }
    }

    /**
     * Store a new action. Most of the fields in the structure correspond to the structure used
     * by the github API to store the action.
     *
     * @param {String} id - the ID of the action (i.e., the fragment ID used in the minutes)
     * @param {String} message - description of the action
     * @param {String} name - the name of the assignee
     * @param {String} assignee - the github id of the assignee
     */
    add_action(id, message, name, assignee) {
        if (this._valid) {
            const gh_action_id = `Action ${this._date}-${id}`;
            let full_message = `${name}: $(message} (${name})`;
            if (this._url) {
                full_message = `${full_message} ([see details](${this._url}#${id}))`;
            }
            this._actions.push({
                gh_action_id,
                title    : `${gh_action_id}: ${message}`,
                body     : `${full_message}\n\nCc: @${assignee}`,
                assignee,
                labels   : ['action']
            });
        }
    }

    /**
     *
     * Get the list of action titles from github; this should be done once to filter
     * out the actions that have already been added.
     */
    async _filter_actions() {
        const extract_titles = (open_issues) => open_issues.items
            .filter((issue) => issue.state === 'open' && issue.pullRequest === undefined)
            .map((issue) => issue.title);

        const repo = this._github.repos(...this._acrepo);

        // Get the titles of issues already stored.
        // The number of action issues may not be that high, better avoid pagination...
        let issues = await repo.issues.fetch({ per_page: 200, labels: 'action' });
        let issue_titles = extract_titles(issues);
        // ... but take care of pages nevertheless
        while (issues.nextPage !== undefined) {
            // eslint-disable-next-line no-await-in-loop
            issues = await issues.nextPage.fetch();
            issue_titles = [...issue_titles, ...extract_titles(issues)];
        }

        // filter the accumulated actions
        const action_not_defined = (action) => issue_titles.find((title) => title.startsWith(action.gh_action_id)) === undefined;
        this._actions = this._actions.filter(action_not_defined);
    }

    async raise_action_issues() {
        console.log(JSON.stringify(this._actions, null, 4));
    }
}






// async function main() {
//     const owner = 'iherman';
//     const repo  = 'oct_test';
//     const titles = await get_issue_titles(owner, repo);
//     console.log(titles);

//     console.log('try to create an issue');
//     await github.repos(owner, repo).issues.create({
//         title    : 'Action 2019-03-05-action6: Notices without assignments',
//         labels   : ['action'],
//         assignee : 'iherman',
//         body     : 'See [me](https://www.ivan-herman.net) \nCc @iherman'
//     });
// }

// main();

/* ========================================================================================== */

module.exports = { Actions };
