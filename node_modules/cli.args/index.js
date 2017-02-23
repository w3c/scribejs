/**
 * @preserve Copyright (c) 2014 Anselm Meyn
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
"use strict";

var path = require('path');

/*
*/
function Option(optionOptions) {
	for (var index in optionOptions) {
		if (optionOptions[index]) {
			this[index] = optionOptions[index];
		}
	}
}

/*
*/
function CliArgsError(usageStr, summaryStr) {
	this.name    = "CliArgsError";
	this.message = "";
	this.usage   = usageStr;
	this.summary = summaryStr;
}
Object.defineProperty(CliArgsError.prototype, "msg", {
	get: function() {
		return this.message;
	},
	set: function(newMsg) {
		this.message = newMsg;
	}
});


function createArgHelper(optionsString, optionsHelp, argv) {
	/*
	*/
	function setupStringOpts(optString) {
		var optsList = {};
		var matchedOptions = optString.match(/([A-Za-z0-9]{1}:?!?)/g);
		matchedOptions && matchedOptions.forEach(function(val) {
			optsList[val[0]] = new Option({
				needsArg   : val[1] === ':',
				isRequired : val[2] === '!' || val[1] === '!'
			});
		});
		return optsList;
	}

	/*
	*/
	function setupArrayOpts(optsArray) {
		var optsList = {};
		optsArray && optsArray.forEach(function(val, index, list) {
			var matchedStrings = val.match(/([A-Za-z0-9]+)(:?!?)/);
			var opt = matchedStrings[1];
			if (opt) {
				optsList[opt] = new Option({
					needsArg   : matchedStrings[2][0] === ':',
					isRequired : matchedStrings[2][1] === '!' || matchedStrings[2][0] === '!',
					isLong     : (opt.length > 1)
				});
			}
		});
		return optsList;
	}

	/*
	*/
	function parseOptString(optString) {
		if (typeof optString === "string" || optString instanceof String) {
			return setupStringOpts(optString);
		}
		else if (optString instanceof Array) {
			return setupArrayOpts(optString);
		}
	}

	/*
	*/
	function parseArgs(argv, options, errObj) {
		var optRegEx = new RegExp("(^-{1,2})([A-Za-z0-9 ,]+)");
		var regexMatch;
		var nonOpt = [];
		var result = {};
		var argvIndex, optStrIndex;
		var currOptStr;
		var option;
		var optionKey;
		var optionsKeys;
		var optionMatches;
		var exactMatch;

		if (!options || Object.keys(options).length <= 0) {
			return { 'nonOpt': argv };
		}
		else {
			optionsKeys = Object.keys(options);
		}

		for (argvIndex=0; argvIndex<argv.length; ++argvIndex) {
			// As per POSIX any args after a '--' should be considered non-optional
			if (argv[argvIndex] === '--') {
				nonOpt = nonOpt.concat(argv.slice(argvIndex+1));
				break;
			}

			// RegExp.exec() returns an array with the following elements,
			// [0] - the matched character(s)
			// [1]..[n] - matched substrings (in parenthesis i.e. 2 in our case)
			// index: index of the match in the string
			// input: original string
			// 		OR
			// null if no match
			regexMatch = optRegEx.exec(argv[argvIndex]);

			if (!regexMatch) {
				nonOpt.push(argv[argvIndex]);
			}
			else {
				// the option is in the 2nd matched substring
				currOptStr = regexMatch[2];

				// use the first substring match to determine short / long option
				if (regexMatch[1] === '--') {
					optionKey = null;
					// find closest matches
					optionMatches = optionsKeys.filter(function(word) {
						return (word.indexOf(currOptStr) === 0);
					});
					if (optionMatches.length === 1) {
						optionKey = optionMatches[0];
					}
					else if (optionMatches.length > 1) {
						exactMatch = optionMatches.filter(function(word) {
							return (currOptStr === word);
						});
						if (!exactMatch || exactMatch.length < 1) {
							errObj.msg = "option --" + currOptStr + " is ambiguous (--" + optionMatches.join(", --") + ")";
							throw errObj;
						}
						else {
							optionKey = exactMatch;
						}
					}

					option = options[optionKey];
					if (option) {
						if (option.needsArg) {
							if (argvIndex+1 < argv.length) {
								result[optionKey] = argv[++argvIndex];
							}
							else {
								errObj.msg = "option needs an argument (" + optionKey + ")";
								throw errObj;
							}
						}
						else {
							result[optionKey] = true;
						}
					}
					else {
						errObj.msg = "unrecognized option (" + currOptStr + ")";
						throw errObj;
					}
				}
				else if(regexMatch[1] === '-') {
					if (!currOptStr) { // if it was only a '-'
						nonOpt.push(argv[argvIndex]);
					}
					else {
						for (optStrIndex=0; optStrIndex<currOptStr.length; ++optStrIndex) {
						    var currChar = currOptStr.charAt(optStrIndex);
						    var remainingChars = currOptStr.substring(optStrIndex+1);
						    if (options[currChar]) {
						        if (options[currChar].needsArg) {
									if (remainingChars) {
										result[currChar] = remainingChars;
									}
									else if (argvIndex+1 < argv.length) {
										result[currChar] = argv[++argvIndex];
									}
									else {
										errObj.msg = "option needs an argument (" + currChar + ")";
										throw errObj;
									}
						            break;
								}
								else {
									result[currChar] = true;
								}
							}
							else {
								errObj.msg = "unrecognized option (" + currChar + ")";
								throw errObj;
							}
						}
					}
				}
			}
		}

		if (nonOpt.length > 0) {
			result['nonOpt'] = nonOpt;
		}

		return result;
	}

	/*
	*/
	function buildSummaryStr(usage, options, helpObj) {
		var summaryStr = [];
		var currOpt;
		var currOptHelp = [];
		if (options) {
			for (var index in helpObj) {
				currOpt = options[index];
				if (currOpt && helpObj[index]) {
					currOptHelp = ['\t'];
					currOptHelp.push((currOpt.isLong ? '--' : '-') + index);
					currOptHelp.push((currOpt.needsArg ? ' ' + helpObj[index][0] + '\n\t\t' + helpObj[index].slice(1).join('\n') : '\t' + helpObj[index].join('\n')));
					summaryStr.push(currOptHelp.join(''));
				}
			}
			if (summaryStr.length > 0) {
				summaryStr.unshift('Options:');
			}
			summaryStr.unshift('Usage: ' + usage);
			helpObj && helpObj['pre'] && summaryStr.unshift(helpObj['pre']);
			helpObj && helpObj['post'] && summaryStr.push(helpObj['post']);
		}
		return summaryStr.join('\n');
	}

	/*
	*/
	function buildUsageStr(argv, options) {
		var usageStr = [];
		var currStr;
		for (var index in options) {
			var option = options[index];
			currStr = '';
			if (option) {
				currStr = (option.isLong ? '--' : '-') + index;
				if (option.needsArg) {
					currStr += ' value';
				}
				if (option.isRequired) {
					usageStr.unshift(currStr);
				}
				else {
					usageStr.push('['+currStr+']');
				}
			}
		}
		usageStr.unshift(argv[0], path.basename(argv[1]));
		return usageStr.join(' ');
	}

	// -- main() --
	argv = argv || process.argv;
	var optionsList = parseOptString(optionsString);
	var usageStr = buildUsageStr(argv, optionsList)
	var summaryStr = buildSummaryStr(usageStr, optionsList, optionsHelp);
	var argsError = new CliArgsError(usageStr, summaryStr);
	var obj = {
		info: {},
	};
	var result = parseArgs(argv.slice(2), optionsList, argsError);

	// do this initially so that if the user wants to use the
	// 'info' or 'argv' keys for themselves they may do so
	obj['argv'] = process.argv;
	obj['info'] = {
		usage: usageStr,
		summary: summaryStr
	};

	for (var index in result) {
		obj[index] = result[index];
	}

	for (var index in optionsList) {
		var option = optionsList[index];
		if (option.isRequired && !obj[index]) {
			argsError.msg = 'required option missing (' + index + ')';
			throw argsError;
		}
	}

	return obj;
}

module.exports = createArgHelper;
