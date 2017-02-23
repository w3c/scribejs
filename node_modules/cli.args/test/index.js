var assert = require('assert');

describe('The cli.args library', function() {
	var cliArgs = require('../index.js');

	it('should return all arguments as non-optional if no options are specified',
		function() {
			assert.deepEqual(cliArgs(null, null, ['node', 'index.js', '-abc', 'def'])['nonOpt'],
							 ['-abc', 'def']);
		}
	);

	it('should return any arguments after \'--\' as non-optional operands',
		function() {
			var result = cliArgs('a:', null, ['node', 'index.js', '-a', 'aVal', '--', '-a', '-b']);
			assert.deepEqual(result['nonOpt'], ['-a', '-b']);
		}
	);

	describe('with short options (described by a single option string)', function() {
		it('should throw an error if no value is specified for a value-dependent option',
			function() {
				assert.throws(function() {
					cliArgs('a:', null, ['node', 'index.js', '-a']);
				},
				function(err) {
					return (err &&
							err.name === 'CliArgsError' &&
							err.message.indexOf('option needs an argument') === 0);
				},
				"unexpected error");

				assert.throws(function() {
					cliArgs('a:b:', null, ['node', 'index.js', '-a', 'aVal', '-b']);
				},
				function(err) {
					return (err && err.name === 'CliArgsError');
				},
				"unexpected error");
			}
		);

		it('should throw an error for invalid options',
			function() {
				assert.throws(function() {
					var result = cliArgs('-a', null, ['node', 'index.js', '-b']);
				},
				function(err) {
					return (err &&
							err.name === 'CliArgsError' &&
							err.message.indexOf('unrecognized option') === 0);
				},
				"unexpected error");
			}
		);

		it("should not allow non-alphanumeric option names",
			function() {
				var result1 = cliArgs('$:?:', null, ['node', 'index.js', '-$', 'val1', '-?val2']);
				var result2 = cliArgs('', null, ['node', 'index.js', '-$', 'val1', '-?val2']);
				assert.deepEqual(result1, result2);
			}
		);

		it('should throw an error if required options are missing',
			function() {
				assert.throws(function() {
					cliArgs('a!b', null, ['node', 'app.js', '-b']);
				},
				function(err) {
					return (err &&
							err.name === "CliArgsError" &&
							err.message.indexOf('required option missing') === 0);
				},
				"unexpected error");
			}
		);

		it('should throw an error if required options with values are missing',
			function() {
				assert.throws(function() {
					cliArgs('a:!', null, ['node', 'app.js', '-a']);
				},
				function(err) {
					return (err &&
							err.name === "CliArgsError" && 
							err.message.indexOf('option needs an argument') === 0);
				},
				"unexpected error");
			}
		);

		it('should correctly parse required options with values',
			function() {
				var result =  cliArgs('a:!b:!c!', null, ['node', 'app.js', '-aval', '-b', 'bVal', '-c']);
				assert.equal(result['a'], 'val');
				assert.equal(result['b'], 'bVal');
				assert.equal(result['c'], true);
			}
		)

		it("should allow options placed in any order to give the same values",
			function() {
				var result1 = cliArgs('b:a:', null, ['node', 'index.js', '-a', 'aVal', '-bbVal']);
				var result2 = cliArgs('b:a:', null, ['node', 'index.js', '-b', 'bVal', '-aaVal']);
				assert.deepEqual(result1, result2);
			}
		);

		it('should pick up the succeeding value as the argument value for value-dependent options',
			function() {
				assert.equal(cliArgs('a:', null, ['node', 'index.js', '-aval'])['a'], 'val');
				assert.equal(cliArgs('a:', null, ['node', 'index.js', '-a', 'val'])['a'], 'val');
				assert.equal(cliArgs('a:', null, ['node', 'index.js', '-a', '-b'])['a'], '-b');
			}
		);

		it('should pick up succeeding values for value-dependent options',
			function() {
				var result = cliArgs('a:b:', null, ['node', 'index.js', '-aval', '-b', 'bVal']);
				assert.equal(result['a'], 'val');
				assert.equal(result['b'], 'bVal');
			}
		);

		it('should set any specified value-independent options to true',
			function() {
				var result = cliArgs('ab', null, ['node', 'index.js', '-a', '-b']);
				assert.equal(result['a'], true);
				assert.equal(result['b'], true);
			}
		);

		it('should not set any unspecified value-independent options',
			function() {
				var result = cliArgs('abc', null, ['node', 'index.js', '-a', '-b']);
				assert.equal(result['a'], true);
				assert.equal(result['b'], true);
				assert.equal(result['c'], undefined);
			}
		);

		it('should allow value-independent options to be grouped',
			function() {
				var result = cliArgs('abc', null, ['node', 'index.js', '-abc']);
				assert.equal(result['a'], true);
				assert.equal(result['b'], true);
				assert.equal(result['c'], true);
			}
		);

		it('should allow mixing value-independent and dependent options',
			function() {
				var result = cliArgs('ab:c', null, ['node', 'index.js', '-abc']);
				assert.equal(result['a'], true);
				assert.equal(result['b'], 'c');
			}
		);

		it('should only allow multi-option arguments separated by spaces',
			function() {
				var result = cliArgs('a:', null, ['node', 'index.js', '-a', 'val1 val2 val3']);
				assert.equal(result['a'], 'val1 val2 val3');
				
				result = cliArgs('a:', null, ['node', 'index.js', '-aval1 val2 val3']);
				assert.equal(result['a'], 'val1 val2 val3');
			}
		);

		it('should allow multi-option arguments separated by commas with or without spaces',
			function() {
				var result = cliArgs('a:', null, ['node', 'index.js', '-a', 'val1,val2,val3']);
				assert.equal(result['a'], 'val1,val2,val3');
				
				result = cliArgs('a:', null, ['node', 'index.js', '-aval1,  val2,val3']);
				assert.equal(result['a'], 'val1,  val2,val3');
			}
		);
	});


	describe('with long options (described by an option array)', function() {
		it('should throw an error for unrecognized options', function() {
			assert.throws(function() {
				cliArgs(['opt1'], null, ['node', 'index.js', '--opt1', '--opt2']);
			},
			function(err) {
				return (err &&
						err.name === "CliArgsError" &&
						err.message.indexOf('unrecognized option') === 0);
			},
			"unexpected error");
		});

		it('should allow setting of options', function() {
			var result = cliArgs(['opt1', 'opt2:'], null, ['node', 'index.js', '--opt1', '--opt2', 'opt2val']);
			assert.equal(result['opt1'], true);
			assert.equal(result['opt2'], 'opt2val');
		});

		it('should throw an error if no value is specified for a value-dependent option',
			function() {
				assert.throws(function() {
					cliArgs(['opt1:'], null, ['node', 'index.js', '--opt1']);
				},
				function(err) {
					return (err &&
							err.name === "CliArgsError" &&
							err.message.indexOf('option needs an argument') === 0);
				},
				"unexpected error");

				assert.throws(function() {
					cliArgs(['opt1:', 'opt2:'], null, ['node', 'index.js', '--opt1', 'aVal', '--opt2']);
				},
				function(err) {
					return (err &&
							err.name === "CliArgsError" &&
							err.message.indexOf('option needs an argument') === 0);
				},
				"unexpected error");
			}
		);

		it('should throw an error for invalid options',
			function() {
				assert.throws(function() {
					var result = cliArgs(['opt1'], null, ['node', 'index.js', '--opt2']);
					console.log(result);
				},
				function(err) {
					return (err &&
							err.name === "CliArgsError" &&
							err.message.indexOf('unrecognized option') === 0);
				},
				"unexpected error");
			}
		);

		it('should throw an error if required options are missing',
			function() {
				assert.throws(function() {
					cliArgs(['opt1!'], null, ['node', 'app.js', 'optArg']);
				},
				function(err) {
					return (err &&
							err.name === "CliArgsError" &&
							err.message.indexOf('required option missing') === 0);
				},
				"unexpected error");
			}
		);

		it('should throw an error if required options with values are missing',
			function() {
				assert.throws(function() {
					cliArgs(['opt1:!'], null, ['node', 'app.js', '--opt1']);
				},
				function(err) {
					return (err &&
							err.name === "CliArgsError" &&
							err.message.indexOf('option needs an argument') === 0);
				},
				"unexpected error");
			}
		);

		it('should correctly parse required options with values',
			function() {
				var result =  cliArgs(['opt1:!','opt2:!', 'opt3!'], null, ['node', 'app.js', '--opt1', 'val', '--opt2', 'bVal', '--opt3']);
				assert.equal(result['opt1'], 'val');
				assert.equal(result['opt2'], 'bVal');
				assert.equal(result['opt3'], true);
			}
		)

		it("should allow options specified in any order to give the same values",
			function() {
				var result1 = cliArgs(['opt1:', 'opt2:'], null, ['node', 'index.js', '--opt1', 'aVal', '--opt2', 'bVal']);
				var result2 = cliArgs(['opt2:', 'opt1:'], null, ['node', 'index.js', '--opt2', 'bVal', '--opt1', 'aVal']);
				assert.equal(result1['opt1'], result2['opt1']);
				assert.equal(result1['opt2'], result2['opt2']);
			}
		);

		it('should set any specified value-independent options to true',
			function() {
				var result = cliArgs(['opt1', 'opt2'], null, ['node', 'index.js', '--opt1', '--opt2']);
				assert.equal(result['opt1'], true);
				assert.equal(result['opt2'], true);
			}
		);

		it('should not set any unspecified value-independent options',
			function() {
				var result = cliArgs(['opt1', 'opt2'], null, ['node', 'index.js', '--opt1']);
				assert.equal(result['opt1'], true);
				assert.equal(result['opt2'], undefined);
			}
		);

		it('should allow mixing value-independent and dependent options',
			function() {
				var result = cliArgs(['opt1','opt2:','opt3'], null, ['node', 'index.js', '--opt1', '--opt2', '--opt3']);
				assert.equal(result['opt1'], true);
				assert.equal(result['opt2'], '--opt3');
			}
		);

		it('should allow multi-option arguments separated by spaces',
			function() {
				var result = cliArgs(['opt1:'], null, ['node', 'index.js', '--opt1', 'val1 val2 val3']);
				assert.equal(result['opt1'], 'val1 val2 val3');
			}
		);

		it('should allow multi-option arguments separated by commas with or without spaces',
			function() {
				var result = cliArgs(['opt1:'], null, ['node', 'index.js', '--opt1', 'val1,val2,val3']);
				assert.equal(result['opt1'], 'val1,val2,val3');
				
				result = cliArgs(['opt1:'], null, ['node', 'index.js', '--opt1', 'val1,  val2,val3']);
				assert.equal(result['opt1'], 'val1,  val2,val3');
			}
		);
	});

	describe('with long and short options (described by an option array)', function() {
		it('should allow mixing long and short option arguments',
			function() {
				var result = cliArgs(['opt1', 'a'], null, ['node', 'index.js', '--opt1', '-a']);
				assert.equal(result['opt1'], true);
				assert.equal(result['a'], true);

				result = cliArgs(['opt1:', 'a:'], null, ['node', 'index.js', '--opt1', 'opt1Val', '-a', 'aVal']);
				assert.equal(result['opt1'], 'opt1Val');
				assert.equal(result['a'], 'aVal');

				result = cliArgs(['opt1', 'a:'], null, ['node', 'index.js', '--opt1', '-a', 'aVal']);
				assert.equal(result['opt1'], true);
				assert.equal(result['a'], 'aVal');

				result = cliArgs(['opt1:', 'a'], null, ['node', 'index.js', '--opt1', 'opt1Val', '-a']);
				assert.equal(result['opt1'], 'opt1Val');
				assert.equal(result['a'], true);
			}
		);

		it('should throw an error for ambiguous long options',
			function() {
				assert.throws(function() {
					var result = cliArgs(['part:', 'party'], null, ['node', 'app.js', '1000', '--pa', '8000']);
					console.log('--p result', result);
				},
				function(err) {
					return (err &&
							err.name === 'CliArgsError' &&
							err.message.indexOf('option --'+'pa'+' is ambiguous') === 0);
				},
				"unexpected error");
			}
		);

		it('should return the right argument for a long option that has the same starting string as another',
			function() {
				var result = cliArgs(['part:', 'party'], null, ['node', 'app.js', '1000', '--part', '8000']);
				assert.equal(result['part'], '8000');
			}
		);

		it('should not throw an error for a short option even with ambiguous long options',
			function() {
				var result = cliArgs(['port:', 'party', 'p:'], null, ['node', 'app.js', '1000', '-p', '8000']);
				assert.equal(result['p'], 8000);
			}
		);
	});
});
