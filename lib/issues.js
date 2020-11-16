'use strict';

const _ = require('underscore');

/**
 * Handling the `scribejs, issue X,Y,Z` type directives. The method returns a set of strings to be added to the
 * final (markdown) minutes. Two informations are returned
 *
 * 1. A standard markdown line is added listing the the issue URL-s.
 * 2. If this works with Jekyll, a comment is returned with the list of URL-s in the form of `<!-- issue URL_X,URL_Y,URL_Z -->`
 *
 * If the original directive just includes a `-` instead of the issue numbers a special HTML/markdown comment returned of the form `<!-- issue - -->`.
 *
 * While the comments are invisible when displayed as part of the minutes, they can be used by postprocessing tools that
 * gathers a portion of the discussions that is relevant to a particular issue or set of issues.
 *
 * @param {Object} config - the general scribejs configuration object
 * @param {string} directive - either 'pr' or 'issue'
 * @param {string} issue_references - comma separated list of issue numbers, possibly of the form `repo#number`
 * @returns {string} - the markdown lines to be added to the final minutes
 */
exports.issue_directives = (config, directive, issue_references) => {
    // see if there is an issue repository to use:
    const repo = config.issuerepo || config.ghrepo;
    if (repo === undefined) {
        return '';
    } else {
        // No exception should disrupt the flow of the minutes generation; the directive is then simply discarded.
        try {
            // This information is necessary if the issue is not bound to the default repository.
            const organization = repo.split('/')[0];

            // Some details are different whether we are talking about PR-s or issues: the exact URL and the text to be added to the response
            const peel_issue_pr = (val) => {
                if (val === 'pr') {
                    return {
                        issue_or_pr : 'pull request',
                        url_part    : 'pulls'
                    };
                } else {
                    return {
                        issue_or_pr : 'issue',
                        url_part    : 'issues'
                    };
                }
            };
            const { issue_or_pr, url_part } = peel_issue_pr(directive);

            // Separate the 'closing' directive
            if (url_part.startsWith('-')) {
                // This, in fact, is to stop the effect of the issue discussion
                if (config.jekyll !== 'none') {
                    return '\n\n<!-- issue - -->\n\n'
                } else {
                    return '';
                }
            } else {
                const issue_numbers = issue_references.split(',').map((str) => str.trim());
                // By default, the numbers are just numbers for the default issue repository, but the
                // user is entitled to give a repo#number, and the URL must be separated.
                // Note that, at this moment, the organization remains the same, the tooling is not prepared for the case
                // when the group is handling several organizational repositories at the same time... The default group
                // repository's organization wins.

                // List of the final issue URL-s
                const urls = issue_numbers.map((num) => {
                    if (num.includes('#')) {
                        const parts = num.split('#');
                        return `https://github.com/${organization}/${parts[0]}/${url_part}/${parts[1]}`
                    } else {
                        return `https://github.com/${repo}/${url_part}/${num}`
                    }
                });

                // Generation of the (visible) markdown entries
                const all_issues = _.zip(issue_numbers, urls)
                    .map((num_url) => {
                        const prefix = num_url[0].includes('#') ? '' : '#';
                        return `[${prefix}${num_url[0]}](${num_url[1]})`
                    })
                    .join(', ');
                const md_part =  `See ${issue_or_pr} ${all_issues}.`;

                // Add, if necessary, the comment to the return.
                if (config.jekyll !== 'none') {
                    const md_comment = `<!-- issue ${urls.join(' ')} -->`;
                    return `\n\n${md_part}\n\n${md_comment}\n\n`;
                } else {
                    return `\n\n${md_part}\n\n`
                }
            }
        } catch (e) {
            // No exception should disrupt the flow of the minutes generation; the directive is then simply discarded.
            return '';
        }
    }
};
