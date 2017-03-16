# Converter of RSSAgent IRC logs into minutes in markdown

[![Join the chat at https://gitter.im/w3c/scribejs](https://badges.gitter.im/w3c/scribejs.svg)](https://gitter.im/w3c/scribejs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This script takes an IRC output as produced by the RRSAgent on W3C’s IRC, and converts into into minutes in markdown. Most of the features of [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm) are retained. See also a separate [feature summary](features.md) for an easier reference. The IRC log can either be provided as an input to the script on the command line, or can be fetched directly from the W3C site. The generated minutes are either stored locally or are committed to a GitHub repository directly.

The reason of writing this script is that the current approach of producing HTML minutes on the W3C date space has become difficult to handle these days when Working Groups typically work on GitHub and WG members do not have CVS access to W3C. This means that the current process relies heavily on the staff contact on the slightest possible change of the minutes. In a GitHub working environment the “obvious” approach is to produce the minutes in markdown and push that onto the group’s repository; if so, the minutes can be read and, if necessary, updated, changed, improved, etc, by other Group members.


## [Usage](id:usage)
The script runs on top of `node.js`. The “entry point” is the `index.js` file, which accepts the following command line arguments:

```
scribjs [options] [filename]
[--date|-d] date:    Date of the meeting in ISO (i.e., YYYY-MM-DD) format.
                     Default: today.
[--group|-g] group:  Name of the IRC channel used by the group.
[--config|-c] cfile: JSON configuration file (see [below](#conf)). Command
                     line arguments have a higher priority.
[--output|-o] ofile: Output file name. See [below](#output) on how the final output is chosen.
[--repo|-r]:         Whether the output should be stored in a github repository.
                     Default: false.     
```

### [Configuration files](id:conf)
While some of the values that can be set on a command line, most of the configuration values are set in a JSON configuration file. The file name can be provided on the command line (see above), and a user-level configuration file `$HOME/.scribejs.json` can also be used.

The keys are as follows (see also the [description of the command line](#usage) for their explanation). Use only those keys that have a meaningful value.

```
{
	"date"     : "[Date in ISO Format]",
	"group"    : "[Group's IRC name]",
	"input"    : "[Input]",
	"output"   : "[Output file name; irrelevant if torepo is true]"
	"torepo"   : "[true|false]",
	"ghrepo"   : "[repository name, eg, 'w3c/scribejs']",
	"ghpath"   : "[path in the repository to the folder where the minutes are to be stored]",
	"ghbranch" : "[branch of the repository where the minutes should be stored. If not set, default is used.]"
	"ghname"   : "[github login name]",
	"ghemail"  : "[github email]",
	"ghtoken"  : "[OAUTH personal access token]"
}
```
(See the [relevant GitHub site](https://github.com/settings/tokens) for further details on OAUTH tokens and to generate one)

The final configuration is a combination of the command line arguments, the (optional) configuration file provided through the command line, and the user-level configuration file (if it exists), in decreasing priority.

A typical usage of the configuration files is:

* set the group‘s repository data (e.g., `ghrepo`, `ghpath`, `ghbranch`, `group`) in a shared configuration file that can be part of the repository itself;
* use the user-level configuration for the more personal entries like `ghname`, `ghemail`, and `ghtoken`. This is especially important for `ghtoken` which should *never* be part of any repository in clear text (in fact, GitHub catches those occurrences and invalidates those tokens immediately…)
* use the command line for the right date (which is used by the script to retrieve the IRC log) and for the switch whether the output should be a local file (possibly modified locally and committed to the GitHub repository manually) or whether it should be committed automatically. Note that, obviously, the `gh*` type keys can be ignored if the user choses to never commit minutes automatically on GitHub.

### [Choice of the output](id:output)

The script’s choice of where resulting file is stored is as follows:

* if the value of `torepo` in the final configuration is `true`, the `gh...` values are used to determine the github repository (with, optionally, the relevant branch) and the path within the repository where the minutes should be stores (or updated);
* otherwise, if the `output` value is set, the result is stored in that file;
* otherwise the result is sent to the standard output.  

This means that the simples possible usage of the script boils down to:

```
scribejs IRC-log-file
```

which takes the log from the local `IRC-log-file` and sends the markdown minutes to standard output.

## Installation

Standard `node.js` practices have been followed. This means that repository can be cloned and, in the directory of the repository, the `npm install` command can be used. This should create a symbolic link to `index.js` in the user’s search path with the name `scribejs`.

The repository also contains a copy of all the dependencies (i.e., the necessary node modules) in the `node_modules` directory. That means that `node index.js` (or an alias thereof) should also be functional without any further installation.
