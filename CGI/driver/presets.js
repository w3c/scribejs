const storage_key = "scribejs_webstorage_presets";

/*------------------------------------------------------------------- */

const retrieve_presets   = () => JSON.parse(localStorage.getItem(storage_key))
const store_presets      = (all_presets) => {
	localStorage.setItem(storage_key, JSON.stringify(all_presets))
	generate_preset_menu(all_presets);
};

const JEKYLL_NONE		= "none";
const JEKYLL_MARKDOWN	= "md";
const JEKYLL_KRAMDOWN	= "kd";

/*
 *
 */
function set_presets(val) {
	const zeropadding = (n) =>  n < 10 ? "0" + n : "" + n;
	if(val === "None") {
		document.getElementById('main_form').reset();
	} else {
		let all_presets = retrieve_presets();
		if( !_.isEmpty(all_presets) ) {
			if( all_presets[val] !== undefined ) {
				let preset       = all_presets[val];
				let date         = new Date();
				let month        = zeropadding(date.getMonth() + 1);
				let day          = zeropadding(date.getDate());
				let year         = date.getFullYear();
				let date_input   = document.getElementById("date");
				date_input.value = `${year}-${month}-${day}`;

				/* Go through the keys of the preset and set the relevant element accordingly */
				for(var key in preset) {
				    var value = preset[key];

					// 1. step: get the element that has to be modified
					var element = document.getElementById(key);

					// 2. modify the value. The 'torepo' element must be treated a bit differently
					// the extra check is necessary to avoid problems in case the preset data has a bug...
					if(element) {
						if(key === "torepo") {
							element.selectedIndex = value ? 1 : 0;
						} else if(key === "jekyll") {
							element.selectedIndex = value === JEKYLL_MARKDOWN ? 1 : (value === JEKYLL_KRAMDOWN ? 2 : 0)
						} else {
							element.value = value;
						}
					}
				}

			}
		}
	}
}

/*
 * Reset the preset menu...
 */
function reset_preset_menu() {
	let presets = document.getElementById("presets");
	presets.selectedIndex = 0;
}

/*
 * Generate preset menu
 */
function generate_preset_menu(all_presets) {
	let select_element = document.getElementById("presets");
	// Clean the element
	select_element.innerHTML = "";
	// Add an option for "None"
	let none_element = document.createElement("option");
	none_element.textContent = "None";
	none_element.setAttribute("value", "None");
	none_element.setAttribute("selected", "True");
	select_element.appendChild(none_element);

	if(_.isEmpty(all_presets)) {
		console.log("No Presets");
	} else {
		_.forEach(all_presets, (value,key) => {
			let descr          = value.fullname;
			let option_element = document.createElement("option");
			option_element.textContent = descr;
			option_element.setAttribute("value", key);
			select_element.appendChild(option_element);
		})
	}
}

window.onload = () => {
	let all_presets = localStorage.getItem(storage_key);
	if(all_presets) {
		generate_preset_menu(JSON.parse(all_presets));
	} else {
		store_presets({});
	}
}

/*
 * List presets (for debug only!)
 */
function list_presets() {
	console.log("--- Presets");
	let all_presets = retrieve_presets();
	_.forEach(get_presets(), (value,key) => {
		console.log(value);
	})
	console.log("---");
	// generate_preset_menu(all_presets);
}

/*
 * Delete a preset
 */
function remove_preset() {
	let all_presets = retrieve_presets();
	let group = document.getElementById("group").value;
	store_presets(_.omit(all_presets, group));
}

/*
 * Clear presets
 */
function clear_presets() {
	store_presets({});
}

/*
 * Load data using web storage...
 */
function store_preset() {
	let to_be_stored = {};
	/* Get group name; this is used to as a key to the local storage */
	let group = document.getElementById("group").value;
	if(group !== "") {
		let targets = ["group", "nicknames", "ghrepo", "ghpath", "ghbranch", "ghname", "ghemail", "ghtoken", "fullname"];
		targets.forEach((key) => {
			let val = document.getElementById(key).value;
			if(val !== "") {
				to_be_stored[key] = val;
			}
		})

		if(to_be_stored.fullname === undefined || to_be_stored.fullname === "") {
			to_be_stored.fullname = group;
		}

		var element = document.getElementById("torepo");
		to_be_stored.torepo = element.selectedIndex === 1 ? true : false;

		var element = document.getElementById("jekyll");
		to_be_stored.jekyll = element.selectedIndex === 1 ? JEKYLL_MARKDOWN : (element.selectedIndex === 2 ? JEKYLL_KRAMDOWN: JEKYLL_NONE);

		/* Here comes the meat... */
		let all_presets = retrieve_presets();
		all_presets[group] = to_be_stored;
		store_presets(all_presets);
	} else {
		console.error("no group name has been provided")
	}
}

/*
 * Load the IRC log into the text area. The URL is retrieved using the IRC name and the date.
 * Note that the function using the fetch function; hopefully this works now in all the usual
 * browsers...
 *
 * There is, however, a CORS issue. The IRC log does not have the CORS header set and I could not
 * get `fetch` work properly with the relevant header (why???). For now I use the
 * `https://cors-anywhere.herokuapp.com` trick, and I may have to come back to this later.
 */
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
