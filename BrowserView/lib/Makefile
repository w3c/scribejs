../js/scribejs.js : bridge.js nicknames.js page.js
	browserify page.js bridge.js > ../js/scribejs.js
	uglifyjs ../js/scribejs.js > ../js/scribejs.min.js
