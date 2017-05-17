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
		"ghrepo"	: "w3c/pbg",
		"ghpath"	: "Meetings/Minutes"
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
	const zeropadding = (n) =>  n < 10 ? "0" + n : "" + n;

	if(val === "None") {
		document.getElementById('main_form').reset();
	} else {
		if(presets[val] !== undefined) {
			/* set today's date */
			let date         = new Date();
			let month        = zeropadding(date.getMonth() + 1);
			let day          = zeropadding(date.getDate());
			let year         = date.getFullYear();
			let date_input   = document.getElementById("date");
			date_input.value = `${year}-${month}-${day}`;

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
}

function reset_presets() {
	let presets = document.getElementById("presets");
	presets.selectedIndex = 0;
}

function load_log() {
	set_input_url = (date, group) => {
		let [year, month, day] = date.split('-');
		// return `https://www.w3.org/${year}/${month}/${day}-${group}-irc.txt`;
		return `https://cors-anywhere.herokuapp.com/https://www.w3.org/${year}/${month}/${day}-${group}-irc.txt`;
	};

	let group = document.getElementById("group").value;
	let date  = document.getElementById("date").value;

	// Do it only if it is meaningful...
	if(group !== "" && date !== undefined && date !== "") {
		let target = document.getElementById("text");
		let url = set_input_url(date,group);
		fetch(url)
			.then((response) => {
				if(response.ok) {
					return response.text()
				} else {
					throw new Error(`HTTP response ${response.status}: ${response.statusText}`);
				}
			})
			.then((body) => {
				// Resolve the returned Promise
				target.value = body;
			})
			.catch((err) => {
				let message = `Problem accessing remote file ${url}: ${err.message}`;
				alert(message);
				// reject(message);
			});
	} else {
		alert("No irc name or no valid date...")
	}
}
