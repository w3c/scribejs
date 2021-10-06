# Known bugs or problems, missing features

* recognize issue/pr URL-s as a single item in the line, and use that as a trigger for the issue handling. Essentially, turn it into `scribejs, issue/pr repo#number
  * maybe if it is the only entry after (sub)topic, it may also add the same way...
* At the moment the handling of XML tags (ie, '<word>') is a bit shaky. Maybe a more radical change that turns all '<', resp. '>' signs into a special tag (e.g., `&ltr;`, resp. `$gt;`) at the start of processing is a better option (currently it is artificially put into a pair of backquotes, but this should be fenced against the user already doing that...)


# Long term

* If and when the [github markdown](https://github.github.com/gfm/) is really implemented on github (at present it is not), it should be possible to add `<style>` elements to a file, thereby being able to color certain parts (using `<div>`, for example). At that point, it is worth changing the display of resolutions and actions to color them to, say, red and green, and make them bold (instead of using the blockquote as of now). (Note that this is unnecessary if kramdown is used for jekyll; there is a possibility to add classes directly.)

