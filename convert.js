const _ = require('underscore');

/**
 * Conversion of an RRS output into markdown. This is the real "meat" of the whole library...
 *
 * @param {string} body - the IRC log
 * @returns {string} - the minutes in markdown
 */
exports.to_markdown = (body, config) => {
	/**********************************************************************/
	/*                        Helper functions                            */
	/**********************************************************************/
	/**
	 * Get a 'label', ie, find out if there is a 'XXX:' at the beginning of a line
	 *
	 * @param {string} line - one line of text
	 * @returns {object} - {label, content}, containing the (possibly null) label, separated from the rest
	 */
	function get_label(line) {
		let reg = line.trim().match(/^(\w+):(.*)$/)
		if(reg === null) {
			return {
				label: null,
				content: line
			}
		} else {
			let possible_label   = reg[1].trim();
			let possible_content = reg[2].trim();
			// There are some funny cases, however...
			if(["http", "https", "email", "ftp"].includes(possible_label)) {
				// Ignore the label...
				return {
					label:   null,
					content: line
				}
			} else if(possible_label === "...") {
				//this seems to be a recurring error: scribe continuation lines are preceded by
				// "...:" instead of purely "...""
				return {
					label:   null,
					content: "... " + reg[2].trim()
				}
			} else {
				return {
					label:   reg[1].trim(),
					content: reg[2].trim()
				}
			}
		}
	}


	/**
	 * Get a name structure for a nickname. This relies on the (optional) nickname list that
	 * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
	 * The configuration structure is also extended to include the nicknames, so that
	 * the same full names can be used throughout the minutes.
	 *
	 * @param {string} nick - name/nickname
	 * @returns {object} - `name` for the full name and `url` if available
	 */
	 function get_name(nick) {
		 // IRC clients tend to add a '_' to a usual nickname when there
		 // are duplicate logins. Remove that
		 nick = nick.replace(/_+$/,'');
		 // if this nickname has been used before, just return it
		 if(config.nick_mappings[nick]) {
			 return config.nick_mappings[nick]
		 } else {
			 // This is really just a beautification step, i.e.,
			 // it should be silently forgotten if any problem
			 // occurs.
			 try {
				 for(let i = 0; i < config.nicks.length; i++) {
					 let struct = config.nicks[i];
					 if(_.indexOf(struct.nick, nick.toLowerCase()) !== -1) {
						 // bingo, the right name has been found
						 config.nick_mappings[nick] = { name: struct.name };
						 if(struct.url) config.nick_mappings[nick].url = struct.url;

						 return config.nick_mappings[nick]
					 }
				 }
			 } catch(e) {
				 ;
			 }
			 // As a minimal measure, remove the '_' characters from the name
			 // (many people use this to signal their presence when using, e.g., present+)
			 return { name : nick.replace(/_/g, ' ') };
		 }
	 }


	 /**
 	 * Cleanup ta name. This relies on the (optional) nickname list that
 	 * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
 	 * The configuration structure is also extended to include the nicknames, so that
 	 * the same full names can be used throughout the minutes.
 	 *
 	 * @param {string} nick - name/nickname
 	 * @returns {string} - cleaned up name
 	 */
	 function cleanup_name(nick) {
		 return get_name(nick).name
	 }


	/**
	 * Cleanup the header/guest/regret/chair entries. This relies on the (optional) nickname list that
	 * the user may provide, and replaces the (sometimes cryptic) nicknames with real names.
	 * The configuration structure is also extended to include the nicknames, so that
	 * the same full names can be used throughout the minutes.
	 *
	 * This method is used for the header lists; it also creates a link for the name, if available.
	 *
	 * @param {array} nicks - list of names/nicknames
	 * @returns {array} - list of cleaned up names
	 *
	 */
	function cleanup_names(nicks) {
		return _.chain(nicks)
			.map(get_name)
			.map( (obj) => obj.url ? `[${obj.name}](${obj.url})` : obj.name)
			.uniq()
			.value();
	}


	/**
	 * Extract a labelled item, ie, something of the form "XXX: YYY", where
	 * "XXX:" is the 'label'. "XXX" is always in lower case, and the content is checked in lower case, too.
	 *
	 * @param {string} label - the label we are looking for
	 * @param {object} line - a line object of the form {nick, content},
	 * @returns {string} - the content without the label, or null if that label is not present
	 */
	function get_labelled_item(label, line) {
		let lower = line.content.toLowerCase();
		let label_length = label.length + 1;   // Accounting for the ':' character!
		return lower.startsWith(label+":") === true ? line.content.slice(label_length).trim() : null;
	}


	/**
	 * Extract the scribe's nick from the line, ie, see if the label "scribenick" or "scribe" is used
	 *
	 * @param {object} line - a line object of the form {nick, content}
	 * @returns {string} - the scribe name or null
	 *
	 */
	let get_scribe = (line) => (get_labelled_item("scribenick",line) || get_labelled_item("scribe",line));


	/**
	 * Cleanup actions on the incoming body:
	 *  - turn the body (which is one giant string) into an array of lines
	 *  - remove empty lines
	 *  - remove the starting time stamps
	 *  - turn lines into objects, separating the nick name and the content
	 *  - remove the lines coming from zakim or rrsagent
	 *  - remove zakim queue commands
	 *  - remove zakim agenda control commands
	 *  - remove bot commands ("zakim,", "rrsagent,", etc.)
	 *  - remove the "XXX has joined #YYY" type messages
	 *
	 * The incoming body is either a single string with many lines (this is the case when the script is invoked from the
     * command line) or already split into individual lines (this is the case when the data comes via the CGI interface).
	 *
	 * @param {string} body - the full IRC log
	 * @param {boolean} already_split - whether the body is one single string or an array of lines
	 * @returns {array} - array of {nick, content, content_lower} objects ('nick' is the IRC nick)
	 */
	function cleanup(body, already_split = false) {
		let split_body = already_split ? body : body.split(/\n/);
		// (the chaining feature of underscore is really helpful here...)
		return _.chain(split_body)
		   .filter((line) => (_.size(line) !== 0))
		   // Remove the starting time stamp, by cutting off until the first space
		   // Note: these parts may have to be redone, possibly through a
		   //  specific helper function, if the script is adapted to a larger
		   //  palette of IRC client loggers, too.
		   .map((line) => line.slice(line.indexOf(' ') + 1))
		   .map((line) => {
			   // This is where the IRC log lines are turned into objects, separating the nicknames.
			   sp = line.indexOf(' ');
			   retval = {
				   // Note that I remove the '<' and the '>' characters
				   // leaving only the real nickname
				   nick:    line.slice(1,sp-1),
				   content: line.slice(sp+1).trim()
			   };
			   retval.content_lower = retval.content.toLowerCase();
			   return retval;
		   })
		   // Bunch of filters, removing the unnecessary lines
		   .filter((line_object) => (line_object.nick !== 'RRSAgent' && line_object.nick !== 'Zakim'))
		   .filter((line_object) => {
			   return !(
				   line_object.content_lower.startsWith("q+")        ||
				   line_object.content_lower.startsWith("q-")        ||
				   line_object.content_lower.startsWith("q?")        ||
				   line_object.content_lower.startsWith("ack")       ||
				   line_object.content_lower.startsWith("agenda+")   ||
				   line_object.content_lower.startsWith("agenda?")   ||
				   line_object.content_lower.startsWith("trackbot,") ||
				   line_object.content_lower.startsWith("zakim,")    ||
				   line_object.content_lower.startsWith("rrsagent,")
			   )
		   })
		   .filter((line_object) => (line_object.content.match(/^\w+ has joined #\w+/) === null))
		   .filter((line_object) => (line_object.content.match(/^\w+ has left #\w+/) === null))
		   .filter((line_object) => (line_object.content.match(/^\w+ has changed the topic to:/) === null))
		   // End of the underscore chain, retrieve the final value
		   .value();
	};


	/**
	 *  Fill in the header structure with
	 *   - present: comma separated IRC nicknames
	 *   - regrets: comma separated IRC nicknames
	 *   - guests: comma separated IRC nicknames
	 *   - chair: string
	 *   - agenda: string
	 *   - meeting: string
	 *   - date: string
	 *   - scribenick: comma separated IRC nicknames
	 * All these actions, except for 'scribenick', also remove the corresponding
	 * lines from the IRC log array.
	 *
	 * @param {array} lines - array of {nick, content, content_lower} objects ('nick' is the IRC nick)
	 * @returns {object} - {header, lines}, where "header" is the header object, "lines" is the cleaned up IRC log
	 */
	// Beware: although using underscore functions, ie, very functional oriented style, the
	// filters all have side effects in the sense of expanding the 'header structure'. Not
	// very functional but, oh well...
	function set_header(lines) {
		let headers = {
			present: [],
			regrets: [],
			guests:  [],
			chair:   [],
			agenda:  "",
			date:    "",
			scribe:  [],
			meeting: ""
		};

		/**
		 * Extract a list of nick names (used for present, regrets, and guests)
		 * All of these have a common structure: 'XXX+' means add nicknames, 'XXX-' means remove
		 * nicknames, 'XXX:' means set them.
		 * If found, the relevant field in the header object is extended.
		 *
		 * @param {string} category - the 'label' to look for
		 * @param {object} line - IRC line object
		 * @returns {boolean} - true or false, depending on whether this is indeed a line with that category
		 */
		// Care should be taken to trim everything, to keep the nick names clean of extra spaces...
		function people(category, line) {
			let get_names = (index) => {
				let retval = line.content.slice(index+1).trim().split(',');
				if(retval.length === 0 || (retval.length === 1 && retval[0].length === 0)) {
					return [line.nick]
				} else {
					return retval;
				}
			};

			let lower    = line.content_lower.trim();
			let cutIndex = category.length;
			if(lower.startsWith(category) === true) {
				// bingo, we have to extract the content
				// There are various possibilities, through
				action = _.union
				if(lower.startsWith(category + "+") === true) {
					names = get_names(cutIndex);
				} else if(lower.startsWith(category + "-") === true) {
					names = get_names(cutIndex);
					action = _.difference
				} else if(lower.startsWith(category + ":") === true) {
					names = line.content.slice(cutIndex+1).trim().split(',');
				} else {
					// This is not a correct usage...
					return false;
				}
				headers[category] = action(headers[category], _.map(names, (name) => name.trim()))
				return true;
			} else {
				return false;
			}
		}


		/**
		 * Extract single items like "agenda:" or "chairs:"
		 * If found, the relevant field in the header object is set.
		 *
		 * @param {string} category - the 'label' to look for
		 * @param {object} line - IRC line object
		 * @returns {boolean} - true or false, depending on whether this is indeed a line with that category
		 */
		function single_item(category, line) {
			let item = get_labelled_item(category, line);
			if(item !== null) {
				headers[category] = item;
				return true;
			} else {
				return false;
			}
		}


		/**
		 * Handle the scribe(s): see if this is a scribe setting line. If so, extends the header.
         *
		 * @param {object} line - IRC line object
		 * @returns {boolean} - always true (this function is used in a filter; this means that the line stays in the IRC log for now!)
		 */
		function handle_scribes(line) {
			let scribenick = get_scribe(line);
			if(scribenick !== null) {
				headers["scribe"].push(scribenick);
			}
			return true;
		}


		// filter out all irc log lines that are related to header information
		let processed_lines = _.chain(lines)
			.filter((line) => !people("present", line))
			.filter((line) => !people("regrets", line))
			.filter((line) => !people("guests", line))
			.filter((line) => !people("chair", line))
			.filter((line) => !single_item("agenda", line))
			.filter((line) => !single_item("meeting", line))
			.filter((line) => !single_item("date", line))
			.filter((line) => handle_scribes(line))
			.filter((line) => (line.nick !== 'trackbot'))
			.value();

		return {
			headers: _.mapObject(headers, (val,key) => {
				if(_.isArray(val)) {
					return cleanup_names(val).join(", ");
				} else {
					return val;
				}
			}),
			lines  : processed_lines
		}
	};


	/**
	 * Handle the i/../../ type lines, ie, insert new lines
	 *
	 * @param {array} lines - array of {nick, content, content_lower} objects ('nick' is the IRC nick)
 	 * @returns {array} - returns the lines with the possible changes done
	 */
	function perform_insert(lines) {
		// This array will contain change request structures:
		// lineno: the line number of the change request
		// at, add: the insert values
		let insert_requests    = [];

		// This is the method used to see if it is a change request.
		// Note that there are two possible syntaxes:
		//   i/.../.../
		//   i|...|...|
		let get_insert_request = (str) => {
			return str.match(/^i\/([\w ]+)\/([^\/]+)\/{0,1}/) ||
			       str.match(/^i\|([\w ]+)\|([^\|]+)\|{0,1}/)
		};
		const marker           = "----INSERTREQUESTXYZ----";

		retval = _.chain(lines)
			// Because the insert is to work on the preceding values, the
			// array has to be traversed upside down...
			.reverse()
		  	.map((line, index) => {
				// Find the insert requests, extract the values to a separate array
				// and place a marker to remove the original request
				// (Removing it right away is not a good idea, because things are based on
				// the array index later...)
				let r = get_insert_request(line.content);
	  			if(r !== null) {
	  				// store the regex results
	  				insert_requests.push({
						lineno : index,
	  					at     : r[1],
	  					add    : r[2],
						valid  : true
	  				});
	  				line.content = marker;
	  			}
	  			return line
			})
			.map((line, index) => {
				// See if a content has to be modifed by one of the insert requests
				if(line.content !== marker) {
					let retval = line;
					for(let i = 0; i < insert_requests.length; i++) {
						let insert = insert_requests[i]
						if(insert.valid && index > insert.lineno && line.content.indexOf(insert.at) !== -1) {
							// this request has played its role...
							insert.valid = false;
							// This is the real action: add a new structure, ie, a new line
							let new_line = {
								nick:    line.nick,
								content: insert.add,
								content_lower: insert.add.toLowerCase()
							};
							retval = [line, new_line]
							break;  // we do not need to look at other request for this line
						}
					}
					return retval;
				}
				return line
			})
			// Flatten, ie, what was added as an array of two lines should now transformed
			// into simple entries
			.flatten(true)
			// Remove the markers
			.filter((line) => (line.content !== marker))
			// return the array into its original order
			.reverse()
			// done:-)
			.value();

		return retval;
	};


	/**
	 * Handle the s/../.. type lines, ie, make changes on the contents
	 *
	 * @param {array} lines - array of {nick, content, content_lower} objects ('nick' is the IRC nick)
 	 * @returns {array} - returns the lines with the possible changes done
	 */
	function perform_changes(lines) {
		// This array will contain change request structures:
		// lineno: the line number of the change request
		// from, to: the change values
		// g, G: booleans to signal whether these flag have been set
		// valid: boolean that signals that this request is still valid
		let change_requests    = [];

		// This is the method used to see if it is a change request.
		// Note that there are two possible syntaxes:
		//   s/.../.../{gG}
		//   s|...|...|{gG}
		let get_change_request = (str) => {
			return str.match(/^s\/([\w ]+)\/([^\/]*)\/{0,1}(g|G){0,1}/) ||
			       str.match(/^s\|([\w ]+)\|([^/|]*)\|{0,1}(g|G){0,1}/)
		};
		const marker           = "----CHANGEREQUESTXYZ----";

		retval = _.chain(lines)
			// Because the change is to work on the preceding values, the
			// array has to be traversed upside down...
			.reverse()
		  	.map((line, index) => {
				// Find the change requests, extract the values to a separate array
				// and place a marker to remove the original request
				// (Removing it right away is not a good idea, because things are based on
				// the array index later...)
				let r = get_change_request(line.content);
	  			if(r !== null) {
	  				// store the regex results
	  				change_requests.push({
	  					lineno : index,
	  					from   : r[1],
	  					to     : r[2],
	  					g      : r[3] === "g",
	  					G      : r[3] === "G",
						valid  : true
	  				});
	  				line.content = marker
	  			}
	  			return line
			})
			.map((line, index) => {
				// See if a line has to be modifed by one of the change requests
				if(line.content !== marker) {
					_.forEach(change_requests, (change) => {
						// One change request: the change should occur
						// - in any case if the 'G' flag is on
						// - if the index is beyond the change request position otherwise
						if(change.valid && line.content.indexOf(change.from) !== -1) {
							if(change.G || index >= change.lineno) {
								// Yep, this is to be changed
								line.content = line.content.replace(change.from, change.to);
							}
							// If this was not a form of 'global' change then its role is done
							// and the request should be invalidated
							if(!(change.G || change.g)) {
								change.valid = false;
							}
						}
					})
				}
				return line
			})
			// Remove the markers
			.filter((line) => (line.content !== marker))
			// return the array into its original order
			.reverse()
			// done:-)
			.value();

		// console.log(change_requests)
		return retval;
	};


	/**
	 * Generate the Header part of the minutes: present, guests, regrets, chair, etc.
	 *
	 * Returns a string with the (markdown encoded) version of the header.
	 *
	 * @param {object} headers - the full header structure
	 * @returns {string} - the header in Markdown
	 */
	function generate_header_md(headers) {
		return `![W3C Logo](https://www.w3.org/Icons/w3c_home)
# Meeting: ${headers.meeting}
**Date:** ${headers.date}

See also the [Agenda](${headers.agenda}) and the [IRC Log](${config.orig_irc_log})
## Attendees
**Present:** ${headers.present}

**Regrets:** ${headers.regrets}

**Guests:** ${headers.guests}

**Chair:** ${headers.chair}

**Scribe(s):** ${headers.scribe}
`
	}


	/**
	 * Generate the real content. This is the real core of the conversion...
	 *
	 * The function returns a string containing the (markdown version of) the minutes.
	 *
	 * Following traditions
	 *  - the lines that are not written by the scribe are rendered differently (as a quote)
	 *  - lines beginning with a "..." or a "…" are considered as "continuation lines" by the scribe;
	 *    these are combined into a paragraph
	 *  - "Topic:" and "Subtopic:" produce section headers, and a corresponding TOC is also generated
	 *
	 * @param {array} lines - array of {nick, content, content_lower} objects ('nick' is the IRC nick)
     * @returns {string} - the body of the minutes encoded in Markdown
	 */
	function generate_content_md(lines) {
		// this will be the output
		let content_md     = "\n---\n"
		// this will be the table of contents
		let TOC = "## Content:\n"
		// this will be the list or resolutions
		let resolutions = ""
		// this will be the list or actions
		let actions = ""

		/**
		* Table of content handling: a (Sub)topic's is set a label as well as a reference into a table of content
		* structure that grows as we go.
		* Sections (and the TOC entries) are automatically numbered
		*/
		let counter            = 1;
		let sec_number_level_1 = 0;
		let sec_number_level_2 = 0;
		let numbering          = "";
		let header_level       = "";
		let toc_spaces         = "";


		function add_toc(content, level) {
			if(level === 1) {
				numbering = ++sec_number_level_1;
				sec_number_level_2  = 0;
				header_level = "### ";
				toc_spaces   = "";
			} else {
				numbering = sec_number_level_1 + "." + (++sec_number_level_2);
				header_level = "#### ";
				toc_spaces   = "    ";
			}
			let id = "section" + counter++;
			content_md = content_md.concat("\n\n", `${header_level}[${numbering}. ${content}](id:${id})`)
			TOC = TOC.concat(`${toc_spaces}* [${numbering}. ${content}](#${id})\n`)
		}


		/**
		* Resolution handling: the resolution receives an ID, and a list of resolution is repeated at the end
		*/
		let rcounter = 1;
		function add_resolution(content) {
			let id = "resolution" + rcounter;
			content_md = content_md.concat(`\n\n> [***Resolution #${rcounter}: ${content}***](id:${id})`)
			resolutions = resolutions.concat(`\n* [Resolution #${rcounter}: ${content}](#${id})`)
			rcounter++;
		}

		/**
		* Resolution handling: the resolution receives an ID, and a list of resolution is repeated at the end
		*/
		let acounter = 1;
		function add_action(content) {
			let id = "action" + acounter;
			content_md = content_md.concat(`\n\n> [***Action #${acounter}: ${content}***](id:${id})`)
			actions    = actions.concat(`\n* [Action #${acounter}: ${content}](#${id})`)
			acounter++;
		}

		// "state" variables for the main cycle...
		let current_scribe         = ""
		let within_scribed_content = false;
		let current_person         = "";
		// The main cycle on the content
		_.forEach(lines, (line_object) => {
			// What is done depends on some context...
			// Do we have a new scribe?
			let scribe = get_scribe(line_object);
			if(scribe !== null) {
				// This is a scribe change command; the current scribe must be updated,
				// and the line ignored
				current_scribe = scribe.toLowerCase();
				return;
			}
			// Separate the label from the rest
			let {label, content} = get_label(line_object.content)

			// First handle special entries that must be handled regardless
			// of whether it was typed in by the scribe or not.
			if(label !== null && label.toLowerCase() === "topic") {
				within_scribed_content = false;
				add_toc(content, 1)
			} else if(label !== null && label.toLowerCase() === "subtopic") {
				within_scribed_content = false;
				add_toc(content, 2)
			} else if(label !== null && ["proposed", "proposal"].includes(label.toLowerCase())) {
				within_scribed_content = false;
				content_md = content_md.concat(`\n\n*(${line_object.nick})* **Proposed resolution: ${content}**`)
			} else if(label !== null && ["resolved", "resolution"].includes(label.toLowerCase())) {
				within_scribed_content = false;
				add_resolution(content)
			} else if(label !== null && label.toLowerCase() === "action") {
				within_scribed_content = false;
				add_action(content)
			} else {
				// Done with the special entries, filter the scribe entries
				if(line_object.nick.toLowerCase() === current_scribe) {
					if(label !== null) {
						// A new person is talking...
						content_md = content_md.concat(`\n\n**${cleanup_name(label)}:** ${content}\n`)
						within_scribed_content = true;
						current_person         = label
						// All done with the line!
						return;
					} else {
						let dots = content.startsWith("...") ? 3 : (content.startsWith("…") ? 1 : 0);
						if(dots > 0) {
							let new_content = content.slice(dots).trim();
							if(new_content && new_content[0] === ':') {
								// This is a relatively frequent scribe error, ie, to write "...:" as a continuation
								new_content = new_content.slice(1);
							}
							// This is a continuation line
							if(within_scribed_content) {
								// We are in the middle of a full paragraph for one person, safe to simply add
								// the text to the previous line without any further ado
								content_md = content_md.concat(" ", new_content)
							} else {
								// For some reasons, there was a previous line that interrupted the normal flow,
								// a new paragraph should be started
								content_md = content_md.concat(`\n\n**${cleanup_name(current_person)}:** ${new_content}\n`)
								// content_md = content_md.concat("\n\n", content.slice(dots))
								within_scribed_content = true;
							}
						}
					}
				} else {
					within_scribed_content = false;
					// This is a fall back: somebody (not the scribe) makes a note on IRC
					content_md = content_md.concat("\n\n> *", cleanup_name(line_object.nick), "*: ", line_object.content)
				}
			}
		});

		// Endgame: pulling the TOC, the real minutes and, possibly, the resolutions and actions together
		content_md = content_md.concat("\n\n---\n")

		if(rcounter > 1) {
			// There has been at least one resolution
			TOC         = TOC.concat(`* [${++sec_number_level_1}. Resolutions](#res)\n`)
			content_md  = content_md.concat(`\n\n### [${sec_number_level_1}. Resolutions](id:res)\n` + resolutions)
		}
		if(acounter > 1) {
			// There has been at least one resolution
			TOC         = TOC.concat(`* [${++sec_number_level_1}. Action Items](#res)\n`)
			content_md  = content_md.concat(`\n\n### [${sec_number_level_1}. Action Items](id:act)\n` + actions)
		}
		return TOC + content_md;
	}


	// The real steps...
	// 1. cleanup the content, ie, remove the bot commands and the like
	// 2. separate the header information (present, chair, date, etc)
	//    from the 'real' content. That real content is stored in an array
	//    {nick, content} structures
	let {headers, lines} = set_header(cleanup(body), _.isArray(body));

	// 3. Perform changes, ie, execute on requests of the "s/.../.../" form in the log:
	lines = perform_insert(lines)
	lines = perform_changes(lines)

	// 4. Generate the header part of the minutes (using the 'headers' object)
	// 5. Generate the content part, that also includes the TOC, the list of resolutions and actions (if any)
	//    (using the 'lines' array of objects)
	// 6. Return the concatenation of the two
	return (generate_header_md(headers) + generate_content_md(lines))
}
