var presets = {
	"dpub" 	: {
		"group"	    : "dpub",
		"nicknames" : "/Users/ivan/W3C/github/scribejs/test/dpub-nicknames.json",
		"torepo"	: false,
		"ghrepo"	: "dpub"
	},
	"pwg"	: {
		"group"	    : "pwg",
		"nicknames" : "/Users/ivan/W3C/github/scribejs/test/dpub-nicknames.json",
		"torepo"	: false,
		"ghrepo"	: "w3c/pwg"
	},
	"pbg"	: {
		"group"	    : "pbg",
		"nicknames" : "/Users/ivan/W3C/github/scribejs/test/dpub-nicknames.json",
		"torepo"	: true,
		"ghrepo"	: "w3c/pbg"
	},
	"pbgsc"	: {
		"group"	    : "pbgsc",
		"nicknames" : "/Users/ivan/W3C/github/scribejs/test/dpub-nicknames.json",
		"torepo"	: false,
		"ghrepo"	: "w3c/pbgsc"
	}
};

/*------------------------------------------------------------------- */

function set_presets(val) {
	function zeropadding(n) {
	    return n < 10 ? "0" + n : "" + n;
	}

	if(presets[val] !== undefined) {
		/* set today's date */
		var date = new Date();
		var month = zeropadding(date.getMonth() + 1);
		var day   = zeropadding(date.getDate());
		var year  = date.getFullYear();
		var date_input = document.getElementById("date");
		date_input.value = year + "-" + month + "-" + day;

		/* Go through the keys of the preset and set the relevant element accordingly */
		for(var key in presets[val]) {
		    var value = presets[val][key];

			// 1. step: get the element that has to be modified
			var element = document.getElementById(key);

			// 2. modify the value. The 'torepo' element must be treated a bit differently
			// the extra check is necessary to avoid problems in case the preset data has a bug...
			if(element) {
				if(key === "torepo") {
					element.selectedIndex = value ? 1 : 0;
				} else {
					element.value = value;
				}
			}
		}
	}
}
