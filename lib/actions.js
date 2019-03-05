const octokat = require('octokat');

// eslint-disable-next-line new-cap
const github = new octokat({ token: '6db7a5c881f0af251a685910f0ae9aaf91a5e055' });


async function get_issue_titles(repo_owner, repo_name) {
    const extract_titles = (open_issues) => open_issues.items
        .filter((issue) => issue.state === 'open' && issue.pullRequest === undefined)
        .map((issue) => issue.title);

    const repo = github.repos(repo_owner, repo_name);

    // The number of action issues may not be that high, better avoid pagination...
    let issues = await repo.issues.fetch({ per_page: 200, labels: 'action' });
    let issue_titles = extract_titles(issues);

    while (issues.nextPage !== undefined) {
        // eslint-disable-next-line no-await-in-loop
        issues = await issues.nextPage.fetch();
        issue_titles = [...issue_titles, ...extract_titles(issues)];
    }
    return issue_titles;
}

async function main() {
    const owner = 'iherman';
    const repo  = 'oct_test';
    const titles = await get_issue_titles(owner, repo);
    console.log(titles);

    console.log('try to create an issue');
    await github.repos(owner, repo).issues.create({
        title    : 'Action 2019-03-05-action6: Notices without assignments',
        labels   : ['action'],
        assignee : 'iherman',
        body     : 'See [me](https://www.ivan-herman.net) \nCc @iherman'
    });
}

main();
