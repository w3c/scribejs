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
        const octo = new Octokat({token: conf.ghtoken});
        this.repo = octo.repos(...repo_id.split('/') );
    }

    /**
     * Create a new (markdown) entry on the repository.
     *
     * @param {string} data - data to be uploaded as a separate file
     * @async
     */
    async commit_data(data) {
        const path             = `${this.conf.ghpath}/${this.conf.ghfname}`;
        const path_with_branch = path + (this.conf.ghbranch ? `?ref=${this.conf.ghbranch}` : '');

        // See if the data exists on the specific path; if so, its sha value must be used for the final change
        const info = await this.repo.contents(path_with_branch).fetch();
        const params = {
            sha       : (info && info.sha) ? info.sha : null,
            branch    : this.conf.ghbranch,
            message   : this.conf.ghmessage,
            content   : string_to_base64(data),
            committer : {
                name  : this.conf.ghname,
                email : this.conf.ghemail,
            },
        }
        const retval = await this.repo.contents(path).add(params);
        return retval.content.htmlUrl;
    }

    /**
     * Get the list of issue titles. The method takes care of paging.
     *
     * @return - array of issue titles
     * @async
     */
    async get_issue_titles() {
        let issues;
        let retval = [];
        let page_number = 1;
        do {
            issues = await this.repo.issues.fetch({per_page: 100, page: page_number});
            page_number += 1;
            retval = [...retval, ...issues.items]
        } while (issues.nextPageUrl)
        return retval.map((issue) => issue.title);
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
            collaborators = await this.repo.collaborators.fetch({per_page: 100, page: page_number});
            page_number += 1;
            retval = [...retval, ...collaborators.items]
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

