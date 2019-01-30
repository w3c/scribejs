[![Build Status](https://travis-ci.org/w3c/scribejs.svg?branch=master)](https://travis-ci.org/w3c/scribejs)
[Generate Minutes in your Browser!](https://w3c.github.io/scribejs/BrowserView/)

# Converter of RSSAgent IRC logs into minutes in markdown

This script takes an IRC output as produced by the RRSAgent on W3C’s IRC, and converts into into minutes in markdown. Most of the features of [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm) are retained. See also a separate [feature summary](features.md) for an easier reference. The IRC log can either be provided as an input to the script on the command line, or can be fetched directly from the W3C site. The generated minutes are either stored locally or are committed to a GitHub repository directly.

The reason of writing this script is that the current approach of producing HTML minutes on the W3C date space has become difficult to handle these days when Working Groups typically work on GitHub and WG members do not have CVS access to W3C. This means that the current process relies heavily on the staff contact on the slightest possible change of the minutes. In a GitHub working environment the “obvious” approach is to produce the minutes in markdown and push that onto the group’s repository; if so, the minutes can be read and, if necessary, updated, changed, improved, etc, by other Group members.

## Usage

### Browser

The `BrowserView/` directory contains an HTML file which provides a basic UI for loading and editing IRC logs and processing them into Markdown. See the [Installation](#installation) section below for more information.

### Command Line
The script runs on top of `node.js`. The “entry point” is the `main.js` file, which accepts the following command line arguments:

```
scribejs [options] [filename]
[--date|-d] date:    Date of the meeting in ISO (i.e., YYYY-MM-DD) format.
                     Default: today.
[--group|-g] group:  Name of the IRC channel used by the group.
[--config|-c] cfile: JSON configuration file (see [below](#conf)). Command
                     line arguments have a higher priority.
[--nick|-n] nfile:   JSON nickname mapping URL or filename (see [below](#nick)).
[--output|-o] ofile: Output file name. See [below](#output) on how the final output is chosen.
[--final|-f]:        The minutes are final, i.e., they won't be labeled as "DRAFT".
[--repo|-r]:         Whether the output should be stored in a github repository.
                     Default: false.
[--pandoc|-p]:       Whether the output is meant to be converted further by pandoc.
                     Default: false.
[--jekyll|-j]:       Whether the output should be adapted to a Github+Jekyll combination.
                     Value can be "none", "md", or "kd" (see [below](#jekyll) for further details.)
                     Default: "md".
[--irc|-i] client:   Whether the input is of the log format of a particular IRC client.
                     Value can be "textual", for the Textual IRC client; other values are (currently) ignored.
                     Default: undefined, meaning that the log provided by W3C's RRSAgent is used.
```

### Configuration files
While some of the values can be set on a command line, most of the configuration values are set in a JSON configuration file. The file name can be provided on the command line (see above). Otherwise, a user-level configuration file `~/.scribejs.json` will be used, if present.

The keys are as follows (see also the [description of the command line](#usage) for their explanation). Use only those keys that have a meaningful value.

* `date`       : Date in ISO Format
* `group`      : Group's IRC name
* `input`      : Input
* `output`     : Output file name; irrelevant if `torepo` is `true`
* `nicknames`  : Nickname file reference in the form of a URL or a filename
* `final`      : `true`|`false`
* `torepo`     : `true`|`false`
* `pandoc`     : `true`|`false`
* `jekyll`     : `"none"`|`"md"`|`"kd"`
* `irc_format` : `"textual"`|`undefined`
* `ghrepo`     : repository name, eg, `w3c/scribejs`
* `ghpath`     : path in the repository to the folder where the minutes are to be stored
* `ghbranch`   : branch of the repository where the minutes should be stored. If not set, default is used
* `ghname`     : github login name
* `ghemail`    : github email
* `ghtoken`    : OAUTH personal access token (see the [relevant GitHub site](https://github.com/settings/tokens) for further details on OAUTH tokens and to generate one)

The final configuration is a combination of the command line arguments, the (optional) configuration file provided through the command line, and the user-level configuration file (if it exists), in decreasing priority.

A typical usage of the configuration files is:

* set the group‘s repository data (e.g., `ghrepo`, `ghpath`, `ghbranch`, `group`, `nicknames`) in a shared configuration file that can be part of the repository itself;
* use the user-level configuration for the more personal entries like `ghname`, `ghemail`, and `ghtoken`. **This is especially important for `ghtoken` which should *never* be part of any repository in clear text** (in fact, GitHub catches those occurrences and invalidates those tokens immediately…)
* use the command line for the right date (which is used by the script to retrieve the IRC log) and for the switch whether the output should be a local file (possibly modified locally and committed to the GitHub repository manually) or whether it should be committed automatically. Note that, obviously, the `gh*` type keys can be ignored if the user choses to never commit minutes automatically on GitHub.

There is a [JSON schema](schemas/config_schema.json) to validate the configuration file. The validation is also done run-time; the script warns (on `stderr`) if the configuration file is invalid, and a minimal default configuration is used instead.


### Choice of the output

The script’s choice of where resulting file is stored is as follows:

* if the value of `torepo` in the final configuration is `true`, the `gh...` values are used to determine the github repository (with, optionally, the relevant branch) and the path within the repository where the minutes should be stores (or updated);
* otherwise, if the `output` value is set, the result is stored in that file;
* otherwise the result is sent to the standard output.

This means that the simplest possible usage of the script boils down to:

```
scribejs IRC-log-file
```

which takes the log from the local `IRC-log-file` and sends the markdown minutes to standard output.

### Nickname mapping

This JSON file is used to provide mapping among IRC nicknames and real names. The file itself is an array of objects; each object can use the following keys (use only those with a meaningful value):

* `nick` : the value is an _array_ of strings, each representing a possible IRC handle (nickname); this array (even if empty) is _required_.
* `name` : the value is a string, providing the name to be displayed for that person; this string is _required_.
* `github` : the GitHub id of the person (currently not used, but may be used later).
* `url` : a URL that can be used to set the person’s name as an active link (currently not used, but may be used later).


There is a [JSON schema](schemas/nicknames_schema.json) to validate the nickname mapping file. The validation is also done run-time; the script warns (on `stderr`) if the nickname mapping file is invalid, and an empty mapping is used instead.

## Pandoc

The generated minutes may be converted into some other format using [pandoc](https://pandoc.org). If so, a special [title header]((https://pandoc.org/MANUAL.html#metadata-blocks)) is added, to be used by pandoc when generating HTML or LaTeX.

### Jekyll option

The generated minutes may be part of a page hosted by GitHub via the [Github+Jekyll](https://help.github.com/articles/about-github-pages-and-jekyll/) combination. The possible options, and their meaning, are as follows.

* `none`: Jekyll is ignored. This is the default.
* `md`: the generated minutes includes a special heading, namely:
    ```
    ---
    layout: minutes
    date: [date of minutes]
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

## Installation

Setup the project locally and install Node.js dependencies:

```bash
git clone https://github.com/w3c/scribejs.git
cd scribejs
npm install
```

Follow specific instructions based on your needs/interestes below.

### Browser

```bash
npm run build
npm run serve
```

You should be able to load the UX via `http://localhost:8080` (or whichever port was chosen by `http-server`).

### Command Line

Standard Node.js practices have been followed.

```bash
cp config.json.sample ~/.scribejs.json
$EDITOR ~/.scribejs.json                  # Fill in details: your GH token, etc
```

To run scribejs (in its own directory):

```bash
node .
```

Optionally, you can install it globally with:

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
npm run lint -- main.js
```

It will be run using the configuration settings found in `.eslintrc.yml`.
