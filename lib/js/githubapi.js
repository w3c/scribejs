#!/usr/bin/env node
'use strict';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Octokat = require('octokat');
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
        /**
         * Cache of the issue information structures; using this avoids unnecessary and repeated API calls for issue information
         */
        this.issue_infos = [];
        const octo = new Octokat({ token: conf.ghtoken });
        this.repo = octo.repos(...repo_id.split('/'));
    }
    /**
     * Create a new (markdown) entry on the repository.
     *
     * @param {string} data - data to be uploaded as a separate file
     * @async
     */
    async commit_data(data) {
        const path = `${this.conf.ghpath}/${this.conf.ghfname}`;
        const path_with_branch = path + (this.conf.ghbranch ? `?ref=${this.conf.ghbranch}` : '');
        // See if the data exists on the specific path; if so, its sha value must be used for the final change
        const info = await this.repo.contents(path_with_branch).fetch();
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
        const retval = await this.repo.contents(path).add(params);
        return retval.content.htmlUrl;
    }
    /**
     * Get the list of issue structures as returned by the github API. Note that this method
     * makes use of the class variable `issues_infos` as a cache.
     *
     * This method takes care of paging to get all the issues.
     *
     * @returns - array of objects
     * @async
     */
    async get_issues() {
        let issues;
        if (this.issue_infos.length === 0) {
            // fill the cache...
            let page_number = 1;
            do {
                issues = await this.repo.issues.fetch({ per_page: 100, page: page_number });
                page_number += 1;
                this.issue_infos = [...this.issue_infos, ...issues.items];
            } while (issues.nextPageUrl);
        }
        return this.issue_infos;
    }
    /**
     * Get the list of issue titles.
     *
     * @return - array of issue titles
     * @async
     */
    async get_issue_titles() {
        let retval = await this.get_issues();
        return retval.map((issue) => issue.title);
    }
    /**
     * Get the data for a single issue
     * @param {string|number} issue_number - Issue number
     * @return - the specific issue structure, or undefined
     * @async
     */
    async get_issue_info(issue_number) {
        let infos = await this.get_issues();
        return infos.find((element) => `${element.number}` === `${issue_number}`);
    }
    /**
     * Get the title for a single issue
     *
     * @param {string|number} issue_number - Issue number
     * @return {string} - title of the issue, or empty string if issue number is invalid
     * @async
     */
    async get_issue_title(issue_number) {
        try {
            const info = await this.get_issue_info(issue_number);
            return info.title;
        }
        catch (e) {
            return "";
        }
    }
    /**
     * Get the list of assignees' logins. The method takes care of paging.
     *
     * @return - list of github login names for the assignees
     * @async
     */
    async get_assignees() {
        let collaborators;
        let retval = [];
        let page_number = 1;
        do {
            collaborators = await this.repo.collaborators.fetch({ per_page: 100, page: page_number });
            page_number += 1;
            retval = [...retval, ...collaborators.items];
        } while (collaborators.nextPageUrl);
        return retval.map((person) => person.login);
    }
    /**
     * Create a new issue.
     *
     * @param {Object} issue - issue structure (see the Github API for details)
     * @async
     */
    async create_issue(issue) {
        return this.repo.issues.create(issue);
    }
}
/* ------------------------------------------------------------ */
module.exports = { GitHub };
//# sourceMappingURL=githubapi.js.map