The features handled by the converter are essentially the same as [David Booth's script](https://dev.w3.org/2002/scribe/scribedoc.htm); these are just repeated here for an easier reference.

The script removes all lines referring to queue control, as well as commands referring to the `RSSAgent` or `trackbot` IRC bots.

The IRC commands are based on a `ROLE: value` pattern, where the various “roles” are described below. The roles are case insensitive. For some roles, the syntax `ROLE+ value` or `ROLE- value` may also be used with a slightly different meaning. Some of the roles have aliases. The roles are as follows:

## Scribe control

* `scribenick:` or `scribe:`
	* the value is the IRC nickname of the scribe. Subsequent IRC entries with that nickname are considered to be the “main” minute. The scribe should:
		* use the `name: text` pattern when the person `name` talks and his/her contribution is to be part of the minutes; or
		* use the `...` or `…` character(s) when the same person continues, and/or the scribe prefers to cut the minutes into several lines for convenience. The script combines all these lines into one paragraph. (Except if another command is in the IRC log intertwined with those line, in which case a new paragraph is created.)
	* the scribe is set, usually, at the beginning of the meeting, but it is o.k. to use this command at any time when, for example, there is a switch of scribes
	* the list of scribes is gathered and listed in the header automatically.

## Minute headers

* `meeting:`
	* the value is used as the overall title of the minutes
* `chair:`
	* the chair(s) of the meeting; the value can be a comma separated list of co-chairs
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
* `date:`
	* date of the meeting in ISO (i.e., YYYY-MM-DD)

## Sections

* `topic:`
	* current major topic; the value is used for a section heading and as an entry in the generated table of contents
* `subtopic:`
	* current minor topic; he value is used for a subsection heading and as an entry in the generated table of contents

## Resolutions, actions

* `proposal:` or `proposed:`
	* the value is rendered differently in the generated minutes for an easier reference; it usually precedes a formal vote or a straw possible_label
* `resolution:` or `resolved:`
	* the value is emphasized in the generated minutes and gets its own fragment identifier which makes it possible to use a dedicated URL when referring to a resolution. The list of resolutions is also repeated at the end of the minutes.
* `action:`
	* the value is emphasized in the generated minutes and gets its own fragment identifier which makes it possible to use a dedicated URL when referring to an action. The list of action items is also repeated at the end of the minutes.

## Change of the IRC lines

* `s/from/to/` or `s|from|to|`
	* change, in the generated minutes, the first previous appearance of `from` to `to`. `from` and `to` are regular strings, not regular expressions
* `s/from/to/g` or `s|from|to|g`
	* like a simple change except that *all* previous appearances of `from` are changed to `to`
* `s/from/to/G` or `s|from|to|G`
	* change *all* appearances of `from` to `to` in the minutes
* `i/at/add/` or `i|at|add|`
	* look for the first previous appearance of 'at' and insert a *new line* with the value of `add` as a content *before* the line. A typical usage is to add a topic line that was forgotten (or because the discussion took an unexpected turn)
