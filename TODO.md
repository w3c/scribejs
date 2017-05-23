## Current status

* Testing will clearly reveal new bugs...

## Known bugs or missing features

* The text should be scanned for `<...>` patterns to turn them into "code" in the final text. Otherwise markdown may interpret them as HTML…

* If and when the [github markdown](https://github.github.com/gfm/) is really implemented on github (at present it is not), it should be possible to add `<style>` elements to a file, thereby being able to color certain parts (using `<div>`, for example). At that point, it is worth changing the display of resolutions and actions to color them to, say, red and green, and make them bold (instead of using the blockquote as of now).
