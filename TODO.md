## Current status

* Testing will clearly reveal new bugs...

The handling of actions is still beta!

## Known bugs or missing features

* If and when the [github markdown](https://github.github.com/gfm/) is really implemented on github (at present it is not), it should be possible to add `<style>` elements to a file, thereby being able to color certain parts (using `<div>`, for example). At that point, it is worth changing the display of resolutions and actions to color them to, say, red and green, and make them bold (instead of using the blockquote as of now). (Note that this is unnecessary if kramdown is used for jekyll; there is a possibility to add classes directly.)
* Allow `present+ Name Surname` patterns, ie, do not rely on the `_` character
