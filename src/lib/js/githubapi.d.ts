/**
 * ## Minimal Interfacing the GitHub API
 *
 * This is not a complete API mapping, rather the minimal configuration needed for the rest of the program and implemented as a wrapper around the octocat JavaScript module.
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
     *
     * Create a new (markdown) entry on the repository.
     *
     * @param data - data to be uploaded as a separate file
     * @async
     */
    commit_data(path: string): Promise<string>;

    /**
     * Get the list of issue titles. The method takes care of paging.
     *
     * @return - array of issue titles
     * @async
     */
    get_issue_titles(): Promise<string[]>;


    /**
     * Get the list of assignees' logins. The method takes care of paging.
     *
     * @return - list of github login names for the assignees
     * @async
     */
    get_assignees(): Promise<string[]>;


    /**
     * Create a new issue.
     *
     * @param issue - issue structure
     * @async
     */
    create_issue(issue: GitHub.IssueData): Promise<void>;
}

/**
 * Minimal interface definitions that reflect the portion of the Github API that is used by the rest of the
 * script.
 */
declare namespace GitHub {
    /**
     * Data needed to raise an issue on github
     */
    export interface IssueData {
        /** Title of the issue */
        title: string;
        /** Text of the issue */
        body: string;
        /** Labels to be assigned to the issue */
        labels: string[];
        /** Person to assign the issue to */
        assignee?: string;
    }
}
