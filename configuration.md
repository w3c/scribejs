The configuration file is a json file.

# Members used by `scribejs`

| Member | Value | Description |
|--------|-------|-------------|
| `date`         | string  | Date in ISO Format. Defaults to the date of today. |
| `date`         | string  | Date in ISO Format. Defaults to the date of today.
| `group`        | string  | Group's IRC name, without the starting # or & character
| `input`        | string  | IRC log; a filename or a URL
| `output`       | string  | Output file name; irrelevant if `torepo` is `true`
| `nicknames`    | string  | Nickname file reference in the form of a filename or a URL
| `final`        | boolean | Whether he minutes are final, i.e., they won't be labeled as 'DRAFT'
| `auto`         | boolean | Whether the draft label is to be generated automatically into the minutes via a separate script.
| `torepo`       | boolean | Whether the output should be stored in a github repository
| `pandoc`       | boolean | Whether the goal is to post-process the minutes via the `pandoc` program (this requires minor adjustment on the output)
| `jekyll`       | `"none"` \| `"md"` \| `"kd"` | The exact markdown dialect to be used for the output. If the value is `md` or `kd`, a jekyll header is added. If it is `md`, the format is markdown, if it is `kd`, the format is kramdown
| `schema`       | boolean | Whether the output should include schema.org metadata, encoded in JSON-LD, and added as part of the front matter. Default is `true`.
| `irc_format`   | `"textual"` \| `"irccloud"` \| `"rdf"` \| `undefined` | Choice among available IRC log formats. 'undefined' or 'rdf' means the RRSAgent output at W3C
| `ghrepo`       | string | Github repository name, e.g., `w3c/epub-wg`; this is where the minutes are to be stored
| `dir`          | string
| `ghpath`       | string | Path in the repository to the folder where the minutes are to be stored
| `ghbranch`     | string | Branch of the repository where the minutes should be stored. If not set, default is used
| `acrepo`       | string | Repository name where action issues should be generated. If not set, the value of `ghrepo` is used if set.
| `issuerepo`    | string | Repository name used for issue comments by default, e.g., `w3c/epub-specs`. If none is set, `ghrepo` is used if set.
| `acurlpattern` | string | URL pattern used to refer the minutes. The strings `%YEAR%`, `%MONTH%`, `%DAY%`, and `%DATE%` are replaced by the respective values. Used to put references into the minutes when generating issues or actions.


## Members used by other tools

| Member | Value | Description |
|--------|-------|-------------|
| `group_mail`    | string | Mailing list address to send notifications to
| `mail_subject`  | string | Reference text to the WG, to appear in the mail header
| `group_mail`    | string | Mailing list address to send notifications to
| `group_mail`    | string | Mailing list address to send notifications to
| `handle_issues` | boolean | Whether the issue annotation feature should be used
| `handle_issues` | boolean | Whether the action handling feature should be used
| `current`       | string | Location of the minute processing file, to be updated at post-processing time
| `minutes`       | string | Location of the minute source file, relative to the enclosing directory or repository
| `owner`         | string | Owner organization for the github repo where actions should be raised (e.g., `"w3c"`)
| `repo`          | string | Github repo where actions should be raised
| `dir`           | string | Location of the local clone of the main github repository


## Credential data

It is preferable to store these in a separate, user-dependent file, e.g., `~/.credentials.json`

| Member | Value | Description |
|--------|-------|-------------|
| `ghname`       | string | Github login name
| `ghemail`      | string | Github email
| `ghtoken`      | string | OAUTH personal access token (see the [relevant GitHub site](https://github.com/settings/tokens) for further details on OAUTH tokens and how to generate one).
| `smtp_server`  | string | SMTP server name
| `smtp_port`    | number | SMTP port number
| `smtp_secure`  | boolean | Whether the TLS flag should be turned on for the server
| `smtp_server`  | string | SMTP user name
| `smtp_server`  | string | SMTP user password


## Recursive data

These are members, whose values are objects containing the same values as quoted before. Under specific circumstances those overwrite the general values

### "Local" member

| Member | Value | Description |
|--------|-------|-------------|
| `local` | map | A single map containing members listed in the previous sections. Used to overwrite values when processing is local.

A typical usage is:

```json
{
    "nicknames" : "https://github.com/w3c/reponame/assets/nicknames.json"
    "..."
    "local" : {
        "nicknames" : "/User/github_clones/reponame/assets/nicknames.json",
        "dir": "/User/github_clones/reponame/"
    }
}
```

### "Extra Calls" member

| Member | Value | Description |
|--------|-------|-------------|
| `extra_calls` | map of maps | A single map containing members listed in the previous sections. Used to overwrite values when processing is local. The key to that map is used as an alternative of a group, typically used for structures like task forces.

A typical usage is:

```json
{
    "final" : false,
    "acurlpattern"   : "https://.../xyz-group/Meetings/Minutes/%DATE%-thisGroup",
    "group" : "thisGroup",
    "..."
    "extra_calls" : {
        "thisGroup-taskforce" {
            "final" : true,
            "acurlpattern" : "https://.../xyz-group/Meetings/Minutes/%DATE%-thisGroup-taskforce",
        }
    }
}
```
