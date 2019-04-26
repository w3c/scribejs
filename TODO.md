# Known bugs, missing features

* Implement scribe+, scribe- so that scribes should have to be added one and all of the remain until the end of the call...
  * If we implement `scribe+` only, then `set_header` may be modified easily; then the runtime may use the `header[scribe]` array later. That may be enough for the use case, I am not sure `scribe-` make so much sense...


# Long term

* If and when the [github markdown](https://github.github.com/gfm/) is really implemented on github (at present it is not), it should be possible to add `<style>` elements to a file, thereby being able to color certain parts (using `<div>`, for example). At that point, it is worth changing the display of resolutions and actions to color them to, say, red and green, and make them bold (instead of using the blockquote as of now). (Note that this is unnecessary if kramdown is used for jekyll; there is a possibility to add classes directly.)
