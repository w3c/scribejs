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
     *
     * @param {string} data - string data to be uploaded
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
     */
    async get_issue_titles() {
        let issues = await this.repo.issues.fetch();
        let retval = issues.items;
        let page_number = 1;
        while (issues.nextPageUrl) {
            page_number += 1;
            issues = await this.repo.issues.fetch({page: page_number});
            retval = [...retval, ...issues.items]
        }
        return retval.map((issue) => issue.title);
    }

    /**
     * Get the list of assignees' logins. The method takes care of paging.
     */
    async get_assignees() {
        let collaborators = await this.repo.collaborators.fetch();
        let retval = collaborators.items;
        let page_number = 1;
        while (collaborators.nextPageUrl) {
            page_number += 1;
            collaborators = await this.repo.collaborators.fetch({page: page_number});
            retval = [...retval, ...collaborators.items]
        }
        return retval.map((person) => person.login);
    }

    /**
     * Create a new issue.
     *
     * @param {Object} issue - issue structure (see the Github API for details)
     */
    async create_issue(issue) {
        return this.repo.issues.create(issue);
    }
}

/* ------------------------------------------------------------ */
module.exports = { GitHub };
