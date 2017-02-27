# Converter of IRC RSSAgent minutes into Markdown

This is an early version of a script that takes an IRC output as produced by the RRSAgent on W3C's IRC, and converts that into minutes in markdown. Most of the features of [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm) are retained.

The reason of writing this script is that the current approach of producing HTML minutes on the W3C date space is difficult to handle these days when Working Groups typically work on github and WG members do not have CVS access to W3C. This means that the current process relies pretty much on the staff contact on the slightest possible change of the minutes. In a github environment the "obvious" approach is to produce the minutes in markdown and push that onto a repo; in this case minutes can be read and, possibly, updated easily by the Working Group members.

## Usage
The script has been rewritten from scratch on top of node.js. The "entry point" of the package is the `run` file, which accepts the following command line arguments:

```
-d date: Date for the minutes in ISO (i.e., YYYY-MM-DD) format.
         Default: today
-w wg:   Name of the IRC channel used by the group.
         Default: dpub (just for testing…)
-i file: Local file name or a full URL for the IRC log. If not set, the date
         and the wg is used to retrieve the IRC log from W3C’s date
		 space using the conventions of RRSAgent
-c file: Local configuration file in JSON format (see below). Command line
         arguments have a higher priority.
-o file: Where to put the output; otherwise goes to the standard
         output
```

Some of the values that can be set on a command line can also be collected in a JSON file. The keys are as follows (see the description of the command line for their explanation). Use only those keys that have a meaningful value.

```JSON
{
	"date"   : "[Date in ISO Format]",
	"group"  : "[Group's name]",
	"input"  : "[Input]",
	"output" : "[Output file name]"
}
```


(See [current status and to do](TODO.md).)
