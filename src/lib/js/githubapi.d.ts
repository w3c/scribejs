/**
 * ## Minimal Interfacing the GitHub API
 *
 * This is not a complete API mapping, rather than the minimal configuration needed and implemented as a wrapper around the octocat JavaScript module.
 *
 * (I wish there was a full TypeScript type definition for octocat, which would make this wrapper unnecessary...)
 *
 * @packageDocumentation
*/

import { Configuration } from '../types';


/**
 * Wrapper around a the Github API using the more generic octocat library.
 *
 */
export class GitHub {
    /**
     *
     * @param repo - Github repo identifier in a `owner/repo` format
     * @param conf - program configuration
     */
    constructor(repo: string, conf: Configuration);

    private conf: Configuration;
    private _repo: any;

    /**
     * @param {string} data - string data to be uploaded
     */
    commit_data(path: string): Promise<string>;

    /**
     * Get the complete list of issues titles.
     */
    get_issue_titles(): Promise<string[]>;


    /**
     * Get the list of assignees' logins.
     */
    get_assignees(): Promise<string[]>;


    /**
     * Add a new issue
     *
     * @param issue - details of the issue to be raised.
     */
    create_issue(issue: GitHub.IssueData): Promise<void>;
}

/**
 * Minimal interface definitions that reflect the portion of the Github API that is used by the rest of the
 * script.
 */
declare namespace GitHub {
    export interface IssueData {
        title: string;
        body: string;
        labels: string[];
        assignee?: string;
    }

    interface Label {
        name: string;
        [index: string]: any;
    }

    export interface Issue {
        state: string;
        pullRequest: string;
        labels: Label[];
        title: string;
        [index: string]: any;
    }
}
