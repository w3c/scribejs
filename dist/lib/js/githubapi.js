#!/usr/bin/env node
'use strict';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Octokat = require('octokat');
const base64_to_string = (data) => Buffer.from(data, 'base64').toString('utf-8');
const string_to_base64 = (string) => Buffer.from(string).toString('base64');
/**
 * Wrapper around a the Github API using the more generic octocat library.
 *
 */
class GitHub {
    /**
     *
     * @param {string} repo_id - Github repo identifier in a `owner/repo` format
     * @param {Object} conf - program configuration
     */
    constructor(repo_id, conf) {
        this.conf = conf;
        this._repo = new Octokat({ token: conf.ghtoken }).repos(...repo_id.split('/'));
    }
    /**
     *
     * @param {string} data - string data to be uploaded
     * @async
     */
    async commit_data(data) {
        const path = `${this.conf.ghpath}/${this.conf.ghfname}`;
        const path_with_branch = path + (this.conf.ghbranch ? `?ref=${this.conf.ghbranch}` : '');
        // See if the data exists on the specific path; if so, its sha value must be used for the final change
        const info = await this._repo.contents(path_with_branch).fetch();
        const params = {
            sha: (info && info.sha) ? info.sha : null,
            branch: this.conf.ghbranch,
            message: this.conf.ghmessage,
            content: string_to_base64(data),
            committer: {
                name: this.conf.ghname,
                email: this.conf.ghemail,
            },
        };
        const retval = await this._repo.contents(path).add(params);
        return retval.content.htmlUrl;
    }
    /**
     * Get the list of issue titles. Note that the method takes care of paging.
     *
     * @return - array of issue titles
     */
    async get_issue_titles() {
        const pages = await this._repo.issues.fetch({ per_page: 200 });
        const issues = await pages.all();
        return issues.map((issue) => issue.title);
    }
    /**
     * Get the list of assignees' logins. Note that the method takes care of paging.
     */
    async get_assignees() {
        const pages = await this._repo.assignees.fetch('assignees', {}, { per_page: 200 });
        const assignees = await pages.all();
        return assignees.map((assignee) => assignee.login);
    }
    /**
     * Create a new issue.
     *
     * @param {Object} issue - issue structure (see the Github API for details)
     */
    async create_issue(issue) {
        return this._repo.issues.create(issue);
    }
}
/* ------------------------------------------------------------ */
module.exports = { GitHub };
//# sourceMappingURL=githubapi.js.map