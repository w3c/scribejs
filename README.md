[Generate Minutes in your Browser!](https://w3c.github.io/scribejs/BrowserView/)

# RSSAgent IRC Logs Into Minutes in Markdown

This script takes an IRC output as produced by the RRSAgent on W3C’s IRC, and converts it into minutes in markdown. Most of the features of [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm) are retained. See also a separate [feature summary](https://w3c.github.io/scribejs/features.html) for an easier reference. The IRC log can either be provided as an input to the script on the command line, or can be fetched directly from the W3C site. The generated minutes are either stored locally or are committed to a GitHub repository directly.

The reason of writing this script is that the current approach of producing HTML minutes on the W3C date space has become difficult to handle these days when Working Groups typically work on GitHub and WG members do not have CVS access to W3C. The current process relies heavily on the staff contact on the slightest possible change of the minutes. In a GitHub working environment the “obvious” approach is to produce the minutes in markdown and push that onto the group’s repository; if so, the minutes can be read and, if necessary, updated, changed, improved, etc, by other Group members. As an extra bonus, if the group’s Web site is also on github, the minutes can become integral part of that Web Site (including the look-and-feel).

## Usage

### Browser

The `BrowserView/` directory contains an HTML file which provides a basic UI for loading and editing IRC logs and processing them into Markdown (see the [service on-line](https://w3c.github.io/scribejs/BrowserView/index.html)). See the [Installation](#installation) section below for more information.

### Command Line

The script runs on top of `node.js`. The “entry point” is the `main.js` file, which accepts the following command line arguments:

```sh
scribejs [options] [filename]
[--date|-d] date:    Date of the meeting in ISO (i.e., YYYY-MM-DD) format.
                     Default: today.
[--group|-g] group:  Name of the IRC channel used by the group.
[--config|-c] cfile: JSON configuration file (see below). Command line arguments
                     have a higher priority.
[--nick|-n] nfile:   JSON nickname mapping URL or filename (see below).
[--output|-o] ofile: Output file name. See below on how the final output is chosen.
[--final|-f]:        The minutes are final, i.e., they will not be labeled as "DRAFT".
[--auto|-a]:         Whether the draft label is to be generated automatically into
                     the minutes via a separate script.
[--repo|-r]:         Whether the output should be stored in a github repository.
                     Default: false.
[--pandoc|-p]:       Whether the output is meant to be converted further by pandoc.
                     Default: false.
[--jekyll|-j]:       Whether the output should be adapted to a Github+Jekyll
                     combination. Value can be "none", "md", or "kd"; (see below
                     for further details.)
                     Default: "md".
[--irc|-i] client:   Whether the input is of the log format of a particular IRC client.
                     Value can be "textual", "irccloud", or "lounge, for the Textual,
                     IRCCloud, or The Lounge clients, respectively. It can also be
                     "rdf" to consume the RRSAgent RDF/XML dump directly.
                     Other values are (currently) ignored.
                     Default: undefined, meaning that the log provided by the W3C
                     RRSAgent is used.
```

Some notes:

- On the usage of the `--final` and `--auto` flags: by default, the script considers the minutes as drafts, and adds a "DRAFT" notice right after the title. This is in line with the practice that minutes are to be reviewed before the subsequent call before being considered as final. If the `--final` flag is used, this notice is not added to the final minutes; this is useful for minutes taken at a task force meeting, for example. The `--auto` flag provides an alternative to the explicit notice: instead of an explicit notice that title element (in the final HTML) a `class` value of `draft_notice_needed` is added to the title elements. Client side scripts may be used to control the appearance of a "Draft" notice, depending on, e.g., the date of the minutes.

### Configuration files

While some of the values can be set on a command line, most of the configuration values are set in a JSON configuration file. The file name can be provided on the command line (see above). Otherwise, a user-level configuration file `~/.scribejs.json` will be used, if present. A separate, `~/.credentials.json` can also be used (and shared with other applications), typically used to store the user’s GitHub and SMTP credentials. The detailed specification of the configuration file is [documented separately](https://w3c.github.io/scribejs/configuration.html)

The final configuration is a combination of the command line arguments, the (optional) configuration file provided through the command line, and the user-level configuration file (if it exists), in decreasing priority.

A typical usage of the configuration files is:

* set the group‘s repository data (e.g., `ghrepo`, `ghpath`, `ghbranch`, `acrepo`, `issuerepo`, `acurlpattern`, `group`, `nicknames`) in a shared configuration file that can be part of the repository itself;
* use a user-level configuration (`~/.scribejs.json` or `~/.credentials.json`) for the more personal entries like `ghname`, `ghemail`, and `ghtoken`. **This is especially important for `ghtoken` which should *never* be part of any repository in clear text** (in fact, GitHub catches those occurrences in a repository and invalidates those tokens immediately…)
* use the command line for the right date (which is used by the script to retrieve the IRC log) and for the switch whether the output should be a local file (possibly modified locally and committed to the GitHub repository manually) or whether it should be committed automatically. Note that, obviously, the `gh*` type keys can be ignored if the user choses to never commit minutes automatically on GitHub.

There is a [JSON schema](schemas/config_schema.json) to validate the configuration file. The validation is also done run-time; the script warns (on `stderr`) if the configuration file is invalid, and a minimal default configuration is used instead.

Note that this repository contains the current [configuration files for active WG-s](./BrowserView/Groups/); external tools, local scripts, etc., are welcome to use them. Using these pre-set configuration files may make it easier to deploy the script.


### Choice of the output

The script’s choice of where resulting file is stored is as follows:

* if the value of `torepo` in the final configuration is `true`, the `gh...` values are used to determine the github repository (with, optionally, the relevant branch) and the path within the repository where the minutes should be stores (or updated);
* otherwise, if the `output` value is set, the result is stored in that file;
* otherwise the result is sent to the standard output.

This means that the simplest possible usage of the script boils down to:

```bash
scribejs IRC-log-file
```

which takes the log from the local `IRC-log-file` and sends the markdown minutes to standard output.

### Nickname mapping

This JSON file is used to provide mapping among IRC nicknames and real names. The file itself is an array of objects; each object can use the following keys (use only those with a meaningful value):

* `nick` : the value is an _array_ of strings, each representing a possible IRC handle (nickname); this array (even if empty) is _required_.
* `name` : the value is a string, providing the name to be displayed for that person; this string is _required_.
* `github` : the GitHub id of the person
* `url` : a URL that can be used to set the person’s name as an active link (currently not used, but may be used later).


There is a [JSON schema](schemas/nicknames_schema.json) to validate the nickname mapping file. The validation is also done run-time; the script warns (on `stderr`) if the nickname mapping file is invalid, and an empty mapping is used instead.

### Pandoc

The generated minutes may be converted into some other format using [pandoc](https://pandoc.org). If so, a special [title header]((https://pandoc.org/MANUAL.html#metadata-blocks)) is added, to be used by pandoc when generating HTML or LaTeX.

### Jekyll option

The generated minutes may be part of a page hosted by GitHub via the [Github+Jekyll](https://help.github.com/articles/about-github-pages-and-jekyll/) combination. The possible options, and their meaning, are as follows.

* `none`: Jekyll is ignored. This is the default.
* `md`: the generated minutes includes a special heading, namely:
    ```
    ---
    layout: minutes
    date: [date of minutes]
    json-ld: schema.org metadata
    ---
    ```

    Furthermore, the W3C logo is _not_ added to the minutes; this can be done by the layout used for the minutes. The syntax is (Github) markdown.
* `kd`: beyond the features of the `md` option, the minutes are generated in [kramdown](https://kramdown.gettalong.org/documentation.html) syntax and not in (standard Github) markdown. This is the markdown dialect used by Jekyll; the notable difference, in terms of the generated minutes, is the syntax used to assign an identifier to a header, resolution, or an action. As a bonus, the resolutions and the actions are assigned a class name (`resolution` and `action`, respectively) which can be used for extra styling.

#### Generated class names

If the generated minutes are in kramdown format then a number of sections/paragraphs/etc. get specific class names. These can be used for CSS styling when the minutes are generated by Jekyll in HTML. These are:

| Section content                        | class name |
|----------------------------------------| ---------- |
| resolution                             | `resolution` |
| proposed resolution                    | `proposed_resolution` |
| summary                                | `summary` |
| action                                 | `action` |
| Draft notice at the top of the minutes | `draft_notice` |
| H1 element at the top of the minutes (if the `--auto` flag is used)  | `draft_notice_needed` |

### Schema.org data in JSON-LD

The generated minutes may contain schema.org metadata like URL, dates, participants, scribes, etc., encoded in JSON-LD as part of the page header. The metadata also includes the list of resolutions and actions, when applicable. Client-side scripts can make use of that data.

At the moment, a [companion post-processing script](https://iherman.github.io/scribejs-postprocessing/) performs the following post-processing actions:

* extracts the resolutions into a separate JSON file that can be used to display the resolutions client-side
* extracts the actions recorded during the call to raise special issues on a group-specific GitHub repository
* extracts parts of the minutes assigned to specific issues and adds a comment to those with the relevant portion of the minutes for cross-reference

## Installation

Setup the project locally and install Node.js dependencies:

```bash
git clone https://github.com/w3c/scribejs.git
cd scribejs
npm install
```

The code itself is in TypeScript. The sources are in the `src` directory in the repository. If you do any change, run

```bash
tsc
```

to generate the javascript files. All instructions below refer to the generated javascript versions.

Follow specific instructions based on your needs/interests below.

### Browser

```bash
npm run build
npm run serve
```

You should be able to load the UX via `http://localhost:8080` (or whichever port was chosen by `http-server`). Of course, if you run a server on your machine already, that can be used as well, in which case the second command is irrelevant.

### Command Line

Standard Node.js practices have been followed.

```bash
cp config.json.sample ~/.scribejs.json
$EDITOR ~/.scribejs.json                  # Fill in details: your GH token, etc
```

To run scribejs (in its own directory):

```bash
node main.js
```

Optionally, you can also run

```bash
ts-node src/main.ts
```

which will compile the TypeScript source into Javascript on the fly and run the results. (You will have to install `ts-node` separately, though.)

You can install it globally with:

```bash
sudo npm i -g .
```

which will create a symbolic link to `main.js` in the user's search path with the name `scribejs`, so you should be able to invoke it this way, too:

```bash
scribejs
```

The `schemas` directory also includes two [JSON schemas](http://json-schema.org/documentation.html) files for the configuration and the nickname json files, respectively. These can be used with a suitable schema processor (e.g., the [CLI for ajv](https://github.com/jessedc/ajv-cli)) to check the validity of the configuration files. This schemas are used by the running code, too, to check configuration and nickname files.

## Testing

```bash
npm test
```

If you have [Growl](https://github.com/tj/node-growl#installation) setup for
your platform, you can use it like so:

```bash
npm test -- --growl
```

## Linting

We like clean code, so we've introduced tools to help our shared consistency.
You can use `eslint` in the context of this project by running:

```sh
npm run lint
```

It will be run using the configuration settings found in `.eslintrc.js`.

---

Maintainers: [Ivan Herman](https://ivan-herman.net/professional/) and [BigBlueHat](http://bigbluehat.com/)
