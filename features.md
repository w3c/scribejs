# Scribing features

This document describe the features that can/should be used for the purpose of scribing using the W3C IRC Server. The features handled by this converter are essentially the same as [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm), although there some minor additions.

The script removes all lines referring to queue control, as well as commands referring to the `RSSAgent` or `trackbot` IRC bots.

Most IRC commands are based on a `ROLE: value` pattern, where the various “roles” are described below. The roles are case _insensitive_. For some roles, the syntax `ROLE+ value` or `ROLE- value` may also be used with a slightly different meaning. Some of the roles have aliases.

There are also some (currently only one) `scribejs` “tools” that influence the operation of `scribejs`. These begin by the `scribejs, XXX` string and a space, and are followed by the command itself, where `XXX` is the tool identifier.

When referring to names (e.g., `scribenick`, `present`, scribe’s reference to speaker, etc.) the preferred way is to use that person’s IRC nickname. If done that way (and if a suitable configuration file is provided) the script would automatically convert those into the persons’ real name, which make the minutes more readable.

The roles are as follows:

## Scribe control

* `scribenick:` or `scribe:`
	* the value is the IRC nickname of the scribe. Subsequent IRC entries with that nickname are considered to be the “main” minute. The scribe should:
		* use the `name: text` pattern when the person `name` talks and his/her contribution is to be part of the minutes; or
		* use the `...` or the `…` character(s) when the same person continues, and/or the scribe prefers to cut the minutes into several lines for convenience. The script combines all these lines into one paragraph though maintaing the line breaks. (Except if another command is in the IRC log intertwined with those line, in which case a new paragraph is created.)
	* the scribe is set, usually, at the beginning of the meeting, but it is o.k. to use this command at any time when, for example, there is a switch of scribes.
	* the list of scribes is gathered and listed in the header automatically.

## Minute headers

* `meeting:`
	* the value is used as the overall title of the minutes
* `agenda:`
	* the agenda as provided prior to the meeting; the value is a URL
* `present:`
	* comma separated list of meeting participants. *Beware:* this command overrides all previously set participant lists!
* `present+`
	* the value is:
		* comma separated list of meeting participants, which are *added* to the list of participants; or
		* empty, in which case the nickname of that IRC line is added to the list
	* `present-`
		* the value is:
			* comma separated list of meeting participants, which are *removed* (if applicable) from the list of participants; or
			* empty, in which case the nickname of that IRC line is removed from the list
* `guests:`, `guests+`, and `guests-`
 	* the syntax is identical to `present:`, `present+`, and `present-`, respectively; it can be used if guest participants are to be clearly separated from the regular group participants
* `regrets:`, `regrets+`, and `regrets-`
	* the syntax is similar to `present:`, `present+`, and `present-`, respectively; it is used to list group members who have sent, or want to report on IRC, their regrets.
* `chair:`, `chair+`
	* the syntax is similar to `present:` and `present+`, respectively; it is used to list chair(s) of the meeting.
* `date:`
	* date of the meeting in ISO (i.e., YYYY-MM-DD). If not set, the day when the minutes are generated is used.

## Sections

* `topic:`
	* current major topic; the value is used for a section heading and as an entry in the generated table of contents.
* `subtopic:`
	* current minor topic; he value is used for a subsection heading and as an entry in the generated table of contents.

## Resolutions, actions

* `proposal:` or `proposed:`
	* The value is emphasized in the generated minutes for an easier reference; it usually precedes a formal vote or a straw vote.
* `summary:`
	* The value is emphasized in the generated minutes for an easier reference; it usually closes a discussion although without a vote.
* `resolution:` or `resolved:`
	* The value is emphasized in the generated minutes and gets its own fragment identifier which makes it possible to use a dedicated URL when referring to a resolution. The list of resolutions is also repeated at the end of the minutes.
* `action:`
	* The value is emphasized in the generated minutes and gets its own fragment identifier which makes it possible to use a dedicated URL when referring to an action. The list of action items is also repeated at the end of the minutes.

## Change of the IRC lines

* `s/from/to/` or `s|from|to|`
	* change, in the generated minutes, all occurences of the string `from` to `to` in the _closest preceding_ line with a match. `from` and `to` are regular strings, not regular expressions.
* `s/from/to/g` or `s|from|to|g`
	* like a simple change except that *all* previous lines are handled.
* `s/from/to/G` or `s|from|to|G`
	* change *all* appearances of `from` to `to` in the minutes.
* `i/at/add/` or `i|at|add|`
	* look for the _closest preceding_ line matching `at` and insert a *new line* with the value of `add` as a content *before* that line. A typical usage is to add a (sub)topic line that was forgotten or because the discussion took an unexpected turn.

## `Scribejs` Tools

The line starting with `scribejs, XXX [ARGS]` is a `scribejs` tool, where `XXX` is the tool identifier, and the arguments depend on the tool identifier itself. `XXX` may be

* `scribejs, set [nickname] [full name]`
	* Set the (IRC) `nickname` to refer to the full name in the generated minutes. `full name` is space or underscore separated list of words (underscores are converted to spaces). Its use is to provide a one-time extension to the nickname mappings, see [README.md](#nick). 
