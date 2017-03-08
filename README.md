# Converter of IRC RSSAgent minutes into Markdown

This is an early version of a script that takes an IRC output as produced by the RRSAgent on W3C's IRC, and converts that into minutes in markdown. Most of the features of [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm) are retained.

The reason of writing this script is that the current approach of producing HTML minutes on the W3C date space is difficult to handle these days when Working Groups typically work on github and WG members do not have CVS access to W3C. This means that the current process relies pretty much on the staff contact on the slightest possible change of the minutes. In a github environment the "obvious" approach is to produce the minutes in markdown and push that onto a repo; in this case minutes can be read and, possibly, updated easily by the Working Group members.

## Usage
The script has been rewritten from scratch on top of `node.js`. The "entry point" of the package is the `index.js` file, which accepts the following command line arguments:

```
scribjs [options] [filename]
[--date|-d] date:    Date of the meeting in ISO (i.e., YYYY-MM-DD) format.
                     Default: today
[--group|-g] group:  Name of the IRC channel used by the group.
[--config|-c] cfile: Configuration file in JSON (see below). Command
                     line arguments have a higher priority.
[--output|-o] ofile: Output file name. See below on how the final output is chosen.
[--repo|-r]:         Whether the output should be stored in a github repository.
                     Default: false     
```

### Configuration files
Some of the values that can be set on a command line can also be collected in a JSON file. The file name can be provided on the command line (see above), and a user-level configuration file `$HOME/.scribejs.json` can also be used.

The keys are as follows (see the description of the command line for their explanation). Use only those keys that have a meaningful value.

```JSON
{
	"date"     : "[Date in ISO Format]",
	"group"    : "[Group's name]",
	"input"    : "[Input]",
	"output"   : "[Output]"
	"torepo"   : "[true|false]",
	"ghname"   : "[github login name]",
	"ghemail"  : "[github email]",
	"ghtoken"  : "[OAUTH personal access token]"
	"ghrepo"   : "[repository name, eg, 'w3c/scribejs']",
	"ghpath"   : "[path in the repository to the folder where the minutes are to be stored]",
	"ghbranch" : "[branch of the repository where the minutes should be stored. If not set, default is used.]"
}
```

The final configuration is a combination of the command line arguments, the (optional) configuration file provided through the command line, and the user-level configuration file, in decreasing priority.

### Choice of the output

The choice of where to put the resulting file is as follows:

* if the value of `torepo in the final configuration is `true, the `gh...` values are used to determine the github repository (with, optionally, the relevant branch) and the path within the repository where the minutes should be stores (or updated)
* otherwise, if the `output` value is set, the result is stored in that file
* otherwise the result is sent to the standard output.  


(See [current status and to do](TODO.md).)
