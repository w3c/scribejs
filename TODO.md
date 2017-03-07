## Current status

* Working, but some bugs did come up in testing...

## Known bugs or missing features

* At the moment, the github upload goes to the default branch. This also appears in the message coming back to the user. Two things there
    1. Extend the mechanism with an (optional) branch setting
	1. See if the info returned from github includes the URL of the target (instead of building it manually, which becomes a bit hairy if the default branch name has to be extracted...)
