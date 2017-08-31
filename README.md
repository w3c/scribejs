[![Build Status](https://travis-ci.org/w3c/scribejs.svg?branch=master)](https://travis-ci.org/w3c/scribejs)

# Converter of RSSAgent IRC logs into minutes in markdown

This script takes an IRC output as produced by the RRSAgent on W3C’s IRC, and converts into into minutes in markdown. Most of the features of [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm) are retained. See also a separate [feature summary](features.md) for an easier reference. The IRC log can either be provided as an input to the script on the command line, or can be fetched directly from the W3C site. The generated minutes are either stored locally or are committed to a GitHub repository directly.

The reason of writing this script is that the current approach of producing HTML minutes on the W3C date space has become difficult to handle these days when Working Groups typically work on GitHub and WG members do not have CVS access to W3C. This means that the current process relies heavily on the staff contact on the slightest possible change of the minutes. In a GitHub working environment the “obvious” approach is to produce the minutes in markdown and push that onto the group’s repository; if so, the minutes can be read and, if necessary, updated, changed, improved, etc, by other Group members.


## [Usage](id:usage)
The script runs on top of `node.js`. The “entry point” is the `main.js` file, which accepts the following command line arguments:

```
scribjs [options] [filename]
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
[--jekyll|-j]:       Whether the output should be adapted to a Github+Jekyll combination.
                     Value can be "none", "md", or "kd" (see [below](#jekyll) for further details.)
                     Default: "md".
```

### [Configuration files](id:conf)
While some of the values can be set on a command line, most of the configuration values are set in a JSON configuration file. The file name can be provided on the command line (see above). Otherwise, a user-level configuration file `~/.scribejs.json` will be used, if present.

The keys are as follows (see also the [description of the command line](#usage) for their explanation). Use only those keys that have a meaningful value.

* `date`      : Date in ISO Format
* `group`     : Group's IRC name
* `input`     : Input
* `output`    : Output file name; irrelevant if `torepo` is `true`
* `nicknames` : Nickname file reference in the form of a URL or a filename
* `final`     : `true`|`false`
* `torepo`    : `true`|`false`
* `jekyll`    : `"none"`|`"md"`|`"kd"`
* `ghrepo`    : repository name, eg, `w3c/scribejs`
* `ghpath`    : path in the repository to the folder where the minutes are to be stored
* `ghbranch`  : branch of the repository where the minutes should be stored. If not set, default is used
* `ghname`    : github login name
* `ghemail`   : github email
* `ghtoken`   : OAUTH personal access token (see the [relevant GitHub site](https://github.com/settings/tokens) for further details on OAUTH tokens and to generate one)

The final configuration is a combination of the command line arguments, the (optional) configuration file provided through the command line, and the user-level configuration file (if it exists), in decreasing priority.

A typical usage of the configuration files is:

* set the group‘s repository data (e.g., `ghrepo`, `ghpath`, `ghbranch`, `group`, `nicknames`) in a shared configuration file that can be part of the repository itself;
* use the user-level configuration for the more personal entries like `ghname`, `ghemail`, and `ghtoken`. **This is especially important for `ghtoken` which should *never* be part of any repository in clear text** (in fact, GitHub catches those occurrences and invalidates those tokens immediately…)
* use the command line for the right date (which is used by the script to retrieve the IRC log) and for the switch whether the output should be a local file (possibly modified locally and committed to the GitHub repository manually) or whether it should be committed automatically. Note that, obviously, the `gh*` type keys can be ignored if the user choses to never commit minutes automatically on GitHub.

### [Choice of the output](id:output)

The script’s choice of where resulting file is stored is as follows:

* if the value of `torepo` in the final configuration is `true`, the `gh...` values are used to determine the github repository (with, optionally, the relevant branch) and the path within the repository where the minutes should be stores (or updated);
* otherwise, if the `output` value is set, the result is stored in that file;
* otherwise the result is sent to the standard output.  

This means that the simplest possible usage of the script boils down to:

```
scribejs IRC-log-file
```

which takes the log from the local `IRC-log-file` and sends the markdown minutes to standard output.

### [Nickname mapping](id:nick)

This JSON file is used to provide mapping among IRC nicknames and real names. The file itself is an array of objects; each object can use the following keys (use only those with a meaningful value):


* `nick` : the value is an _array_ of strings, each representing a possible IRC handle (nickname)
* `name` : the value is a string, providing the name to be displayed for that person
* `github` : the GitHub id of the person (currently not used, but may be used later)
* `url` : a URL that can be used to set the person’s name as an active link (currently not used, but may be used later)

### [Jekyll option](id:jekyll)

The generated minutes may be part of a page hosted by GitHub via the [Github+Jekyll](https://help.github.com/articles/about-github-pages-and-jekyll/) combination. The possible options, and their meaning, are as follows.

* `none`: Jekyll is ignored. This is the default.
* `md`: the generated minutes includes a special heading, namely:
    ```
    ---
    layout: minutes
    date: [date of minutes]
    ---
    ```

    Furthermore, the W3C logo is _not_ added to the minutes; this can be done by the layout used for the minutes.
* `kd`: beyond the features of the `md` option, the minutes are generated in [kramdown](https://kramdown.gettalong.org/documentation.html) syntax and not in (standard) markdown. This is the markdown dialect used by Jekyll; the notable difference, in terms of the generated minutes, is the syntax used to assign an identifier to a header, resolution, or an action. (The standard markdown syntax, i.e., `#[header](id:theid)`, is not understood by Jekyll.) As a bonus, the resolutions and the actions are assigned a class name (`resolution` and `action`, respectively) which can be used for extra styling.

#### Generated class names

If the generated minutes are in kramdown format then a number of sections/paragraphs/etc. get specific class names. These can be used for CSS styling when the minutes are generated by Jekyll. These are:

| Section content | class name |
|-----------------| ---------- |
| resolution      | `resolution` |
| proposed resolution | `proposed_resolution` |
| summary | `summary` |
| action | `action` |
| Draft notice at the top of the minutes | `draft_notice` |

## Installation

Standard Node.js practices have been followed.

```bash
git clone https://github.com/w3c/scribejs.git
cd scribejs
npm install
cp config.json.sample ~/.scribejs.json
$EDITOR ~/.scribejs.json                  # Fill in details: your GH token, etc
```

To run scribejs:

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

## Testing

```bash
npm test
```
