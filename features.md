# Scribing features

This document describe the features that can/should be used for the purpose of scribing using the W3C IRC Server. The features handled by this converter are essentially the same as [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm), although there some minor additions.

The script removes all lines referring to queue control, as well as commands referring to the `RSSAgent`, `zakim`, `trackbot`, and `github-bot` IRC bots.

Most IRC commands are based on a `ROLE: value` pattern, where the various “roles” are described below. The roles are case _insensitive_. For some roles, the syntax `ROLE+ value` or `ROLE- value` may also be used with a slightly different meaning. Some of the roles have aliases.

There are also some (currently only one) `scribejs` “tools” that influence the operation of `scribejs`. These begin by the `scribejs, XXX` string and a space, and are followed by the command itself, where `XXX` is the tool identifier.

When referring to names (e.g., `scribe`, `present`, scribe’s reference to speaker, etc.) the preferred way is to use that person’s IRC nickname. If done that way (and if a suitable configuration file is provided) the script would automatically convert those into the persons’ real name, which make the minutes more readable.

The various 'roles' are described below.

## Prerequisites: `zakim` and `rrsagent`

Although, strictly speaking, not `scribejs` features, these IRC instructions MUST be issued at the beginning of the call:

* `/invite zakim`
* `zakim, start meeting`

These invites the `zakim` bot, which will also invite the `rrsagent` bot and make the minutes' IRC logs public. The is essential: it will ensure the logging of the irc log, in a specific format, on the W3C servers. `scribejs` relies on those logs. (The `zakim` bot also provides [queue control](https://www.w3.org/2001/12/zakim-irc-bot.html) and has some more features that are not absolutely relevant.)

At the end of the call, the following IRC commands should be issued:

* `zakim, end meeting`

These will generate and store the logs, end the zakim bot. The `rssagent` bot remains on the channel, and should be ended explicitly via

* `rrsagent, bye`

once the minute log has been stored.

## Minute headers

* `meeting:`
    * the value is used as the overall title of the minutes
* `agenda:`
    * the agenda as provided prior to the meeting; the value is a URL
* `present=`
    * comma separated list of meeting participants. *Beware:* this command overrides all previously set participant lists!
* `present+` or `present:`
    * the value is:
        * comma separated list of meeting participants, which are *added* to the list of participants; or
        * empty, in which case the nickname of that IRC line is added to the list
* `present-`
    * the value is:
        * comma separated list of meeting participants, which are *removed* (if applicable) from the list of participants; or
        * empty, in which case the nickname of that IRC line is removed from the list
* `guests:`, `guests=`, `guests+`, and `guests-`
    * the syntax is identical to `present:`, `present=`, `present+`, and `present-`, respectively; it can be used if guest participants are to be clearly separated from the regular group participants.
* `regrets:`, `regrets=`, `regrets+`, and `regrets-`
    * the syntax is similar to  `present:`, `present=`, `present+`, and `present-`, respectively; it is used to list group members who have sent, or want to report on IRC, their regrets.
* `chair:`, `chair=`, `chair+`, `chair-`
    * the syntax is similar to  `present:`, `present=`, `present:` and `present+`, respectively; it is used to list chair(s) of the meeting.
* `date:`
    * date of the meeting in ISO (i.e., YYYY-MM-DD). If not set, the day when the minutes are generated is used.

## Scribe control

An active _scribes’ list_ is maintained using the `scribe` or the `scribenick` IRC commands:

* `scribe:`, `scribe=`, `scribe+`, and `scribe-` (alias: `scribenick`)
    * the syntax is identical to `present:`, `present=`, `present+`, and `present-`, respectively; it can be used to add or remove a name from the active scribes’ list. In contrast to the other terms, `scribe-` does _not_ mean that the person’s name would be removed from the script header (any person who has scribed, even for a little while, deserves being mentioned). The values _MUST_ be the IRC nicknames.

Scribing means that lines, whose IRC nickname appears on the active scribe’s list at the point of scribing, are considered special:

Subsequent IRC entries with that nickname are considered to be the “main” minute. The scribe should:

* use the `name: text` pattern when the person with nickname `name` talks and his/her contribution is to be part of the minutes; or
* use the `...` or the `…` character(s) when the same person continues and the scribe prefers to cut the minutes into several lines for convenience. The script combines all these lines into one paragraph though maintaining the line breaks. (Except if another command is in the IRC log intertwined with those line, in which case a new paragraph is created.)

## Sections

* `topic:`
    * current major topic; the value is used for a section heading and as an entry in the generated table of contents.
* `subtopic:`
    * current minor topic; he value is used for a subsection heading and as an entry in the generated table of contents.

See also the subsection on issue management with `scribejs` commands below.


## Resolutions, actions

* `proposal:` or `proposed:`
    * The value is emphasized in the generated minutes for an easier reference; it usually precedes a formal vote or a straw vote.
* `summary:`
    * The value is emphasized in the generated minutes for an easier reference; it usually closes a discussion although without a vote.
* `resolution:` or `resolved:`
    * The value is emphasized in the generated minutes and gets its own fragment identifier which makes it possible to use a dedicated URL when referring to a resolution. The list of resolutions is also repeated at the end of the minutes.
* `action:`
    * The value is emphasized in the generated minutes and gets its own fragment identifier which makes it possible to use a dedicated URL when referring to an action. The list of action items is also repeated at the end of the minutes. If the `acrepo` configuration option is set, this also creates an issue for the action at the specified github repository.

## Change of the IRC lines

* `s/from/to/` or `s|from|to|`
    * change, in the generated minutes, all occurrences of the string `from` to `to` in the _closest preceding_ line with a match. `from` and `to` are regular strings, not regular expressions.
* `s/from/to/g` or `s|from|to|g`
    * like a simple change except that *all* previous lines are handled.
* `s/from/to/G` or `s|from|to|G`
    * change *all* appearances of `from` to `to` in the minutes.
* `i/at/add/` or `i|at|add|`
    * look for the _closest preceding_ line matching `at` and insert a *new line* with the value of `add` as a content *before* that line. A typical usage is to add a (sub)topic line that was forgotten or because the discussion took an unexpected turn.

## Miscellaneous

* Handling links:
    * If the text contains a markup-style link `[some text](address)`, that is maintained verbatim
    * If the text contains a pattern of the form `-> some text address`, where `address` is a dereferencable URL, the pattern is turned into `[some text](address)`
    * Any dereferencable URL (that is not part of a pattern) is transformed into a valid link, i.e., `[word](word)`
    * For historical reasons, a special 'inverse' pattern is also accepted: a _full line_ of the form `-> address some text`, where `address` is a dereferencable URL, is converted into `See [some text](address)`. (Better not to use that, it can be confusing with the main pattern.)

    Note, however, that these link patterns should not be used in section titles and subtitles. The generated TOC (e.g., by Jekyll) uses the full section heading as a link text, i.e., it should not contain a link itself... (The script removes those links in case they are used.)

## `Scribejs` Tools

A line starting with `scribejs, XXX [ARGS]` is a `scribejs` tool, where `XXX` is the tool identifier, and the arguments depend on the tool identifier itself. The available commands are:

### Adding temporary nicknames

* `scribejs, set [nickname] [full name]`
    * Set the (IRC) `nickname` to refer to the full name in the generated minutes. `full name` is space or underscore separated list of words (underscores are converted to spaces). Its use is to provide a one-time extension to the nickname mappings, see [README.md](#nick). Useful when the call has guests, temporary visitors, etc.

### Handling issue references

* `scribejs, issue Issuenumber1,Issuenumber2, Issuenumber3`
    * Expand the issue numbers to their full URL-s, and add a an extra line to the minutes with these references. The `Issuenumber` can be:
        * an integer, referring to the the relevant github issue in the default repository (see the configuration file);
        * of the form `repo#number` to use a different repo (within the same github organization) rather than the default discussion issue repository (the default can be set in the configuration file).
* `scribejs, pr PRnumber1,PRnumber2,PRnumber3`
    * Similar to the handling of issues, except that all references are for Pull Requests

`scribejs` also offers a shorthand of the form:

```
topic: title @issue Issuenumber1,Issuenumber2
```

is equivalent to:

```
topic: title
scribejs, issue Issuenumber1,Issuenumber2
```

Finally, `scribejs` has additional feature on automatically finding the title text, namely for

```
topic: @issue Issuenumber1,Issuenumber2
```

it also fetches the title of the issue (or pr) identified by `Issuenumber1` from github and uses it for the in the section heading. This abbreviates a frequent pattern in minute taking. (The same shorthand is also available for sub-topics.)

Note that `scribejs` generates some “directives” (in the form of comments) into the generated minutes for these issues. This can be used by post-processing steps to, e.g., extract the discussion on a specific issue from the minutes, and add a comment to github automatically. See, e.g., the separate [scribejs postprocessing tool](https://github.com/iherman/scribejs-postprocessing).
