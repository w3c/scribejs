cli.args
========

[![NPM version](https://badge.fury.io/js/cli.args.svg)](http://badge.fury.io/js/cli.args)
[![Build Status](https://travis-ci.org/meyn/cli.args.svg?branch=master)](https://travis-ci.org/meyn/cli.args.svg?branch=master)

[![npm](https://nodei.co/npm/cli.args.png?mini=true)](https://www.npmjs.org/package/cli.args)

Flexible and easy command line arguments handling library for your node.js applications.

## Installation

    npm install cli.args


## Use

__cli.args__ is a small and versatile library to help you easily support dynamic runtime behavior (based on command line input parameters) in your node.js apps.

For instance, starting a node server on a port that is specified at runtime via a command line option (for e.g. ```-p```) is as simple as,

```js
var args = require('cli.args')('p:');
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(args.p, '127.0.0.1');
console.log('Server running at http://127.0.0.1:'+args.p+'/');
```
which can be started from the command line as,
```bash
$ node app.js -p 8080
Server running at http://127.0.0.1:8080/
```

Furthermore, to ensure that the port number has to always be specified, the only change is an addition to the first line appending a '__!__' to the required option character (```p``` in this case) as shown below,

```js
var args = require('cli.args')('p:!');
```

## Description

__cli.args__ uses an option string (based on the ```getopt()``` style option string) to parse supported command line parameters, and returns an easy to use JSON object of the parsed arguments along with some useful extra information.

The option string may be specified in either a short (POSIX like) option string or a long (GNU long) format options array. Short options are normally specified by a preceding dash / hyphen character (```-```) on the command line, while long options are preceded by double dashes (```--```).

### Option String

* Short format

    In this format, all the valid command line options that the application wants to support are specified in a single string, containing each valid option represented by a single alphanumeric character. Each option character is followed by either (OR both OR none) of the following 2 characters which affect the way the  preceding option is parsed,

    - '__:__' - indicates that the preceding option character requires an argument
    - '__!__' - indicates that the preceding option character is mandatory

    ```js
    var args = require('cli.args')('a'); // the application supports an option named 'a' without an argument
    var args = require('cli.args')('a!'); // indicates that 'a' is a mandatory option
    var args = require('cli.args')('a:'); // indicates that 'a' needs an argument
    var args = require('cli.args')('a:!'); // 'a' is a mandatory option that also requires an argument
    ```

* Long format

    In this format, the valid command line options that the application wants to support are specified as an array of strings. Each valid option is specified as a member of the array followed by a '__:__' or '__!__' character (OR both OR none), to affect the way the option is parsed (similar to the short format).

    ```js
    // An example of an app that supports 2 long format options (--port, --debug),
    // and a short format option -a (single character elements are considered short).
    // The option --port requires an argument and is also a mandatory option for this app.
    var args = require('cli.args')(['port:!', 'debug', 'a']);
    ```

### Resulting object

The parsed arguments are returned as a JSON object. For example consider the following,
```js
var args = require('cli.args')('p:!su');
```

When used from the command line with your node application (app.js) in the following way,
```bash
$ node app.js -u -p 8080 nonOptionalArg1
```

results in the object ```args``` containing the following values,
```js
{
  u: true,   // the -u option with its value (true as it does not require an argument)
  p: '8080', // the -p option with its value
  nonOpt: [ 'nonOptionalArg1' ], // all nonOptional cli arguments are available in this array
  info: {    // a generated object containing app usage information
    usage: 'node app.js -p value [-s] [-u]',
    summary: 'Usage: node app.js -p value [-s] [-u]'
  },
  argv: [    // the original process.argv array contents
    'node',
    '/home/meyn/workspace/playServer/app.js',
    '-u',
    '-p',
    '8080',
    'nonOptionalArg1'
  ]
}
```

## Examples

1. Handling a command line argument (```-p```) which requires a value,
    ```js
    var args = require('cli.args')('p:');
    console.log('-p=' + args.p);
    ```
    use as,
    ```bash
    $ node app.js -p 8080; #output "-p=8080"
    ```

2. Handling multiple arguments (```-p```, ```-s```, ```-u```) with some requiring values (```-p```),
    ```js
    var args = require('cli.args')('p:su');
    console.log('-p=' + args.p + ', -s set: ' + (args.s ? 'y' : 'n') + ', -u set: ' + (args.u ? 'y' : 'n'));
    ```
    use as,
    ```bash
    $ node app.js -s -p 8080; #outputs "-p=8080, -s set: y, -u set: n"
    ```

3. Specifying required arguments,
    ```js
    try {
        var args = require('cli.args')('p:!s');
        console.log('-p=' + args.p);
        console.log('-s set? ' + (args.s ? 'y': 'n'));
    } catch (e) {
        console.error('Command error:', e.message);
    }
    ```
    when used without the required option (```-p```),
    ```bash
    $ node app.js -s; #throws an Error for missing required argument 'p'
    ```

4. Handling long-format arguments,
    ```js
    var args = require('cli.args')(['port:', 'debug']);
    console.log('--port=' + args.port);
    console.log('--debug? ' + (args.debug ? 'y': 'n'));
    ```
    use as,
    ```bash
    $ node app.js --port 8080; #outputs "--port=8080"
                               #        "--debug? n"
    $ node app.js --port 8080 --debug; #outputs "--port=8080"
                                       #        "--debug? y"
    ```

## Tests

    npm test; # requires mocha
