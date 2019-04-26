# Known bugs, missing features

* Implement scribe+, scribe- so that scribes should have to be added one and all of the remain until the end of the call...
  * During final generation, there is an array of active scribes. This array
    * starts with empty list
    * is expanded with scribe(+) statements. `scribe+ name` is more or less equivalent with `scribe: name`, but `scribe:` (without argument) does not contribute anything, `scribe+` does
    * `scribe-` removes from the active scribes
    * When converting, the equality on nick vs. scribe should be exchanged against checking on the list.
    * What is stored run-time are nicknames...


# Long term

* If and when the [github markdown](https://github.github.com/gfm/) is really implemented on github (at present it is not), it should be possible to add `<style>` elements to a file, thereby being able to color certain parts (using `<div>`, for example). At that point, it is worth changing the display of resolutions and actions to color them to, say, red and green, and make them bold (instead of using the blockquote as of now). (Note that this is unnecessary if kramdown is used for jekyll; there is a possibility to add classes directly.)
