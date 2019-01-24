/* eslint-env node, mocha */

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const nodeCmd = process.platform === 'win32' ? 'node' : 'npx';

const invokeScribeJS = (params = [], handlers = null) => {
    const fixedParams = params;
    fixedParams.unshift('.');
    const proc = spawn(nodeCmd, fixedParams);
    const explodedHandlers = Object.entries(handlers);
    for (let event = 0; event < explodedHandlers.length; event++) {
        if (explodedHandlers[event][0] === 'data') {
            proc.stdout.on(explodedHandlers[event][0], explodedHandlers[event][1]);
            proc.stderr.on(explodedHandlers[event][0], explodedHandlers[event][1]);
        } else {
            proc.on(explodedHandlers[event][0], explodedHandlers[event][1]);
        }
    }
};

describe('Basics', () => {
    describe('Node.js', () => {
        it('exists', (done) => {
            invokeScribeJS([], { exit: () => done() });
        });
    });

    describe('scribejs', () => {
        it('returns an error with no params', (done) => {
            const codeChecker = (code) => {
                assert.strictEqual(code, 255);
                done();
            };
            invokeScribeJS([], { exit: codeChecker });
        });

        it('dumps help with “-h”', (done) => {
            let output = '';
            const outputChecker = (data) => {
                output += data;
            };
            const codeChecker = (code) => {
                assert.ok(/Usage:/.test(output));
                assert.ok(/Options:/.test(output));
                assert.ok(/--output \[output\]/.test(output));
                assert.strictEqual(code, 0);
                done();
            };
            invokeScribeJS(['-h'], { data: outputChecker, exit: codeChecker });
        });
    });
});

describe('CLI usage', () => {
    const inputFilename = path.join('test', 'dpub-test.txt');
    const outputFilename = path.join(os.tmpdir(), `scribejs-${process.pid}.md`);

    it('can read log from a local file', (done) => {
        let output = '';
        const outputChecker = (data) => {
            output += data;
        };
        const codeChecker = (code) => {
            assert.ok(/^!\[W3C Logo\]\(https:\/\/www\.w3\.org\/Icons\/w3c_home\)$/m.test(output), 'Logo check failed');
            assert.ok(/^#\s.+\s—\sMinutes$/m.test(output), 'Minutes header check failed');
            assert.strictEqual(code, 0);
            done();
        };
        invokeScribeJS([inputFilename], { data: outputChecker, exit: codeChecker });
    });

    it('can dump result to a local file', (done) => {
        const resultChecker = (code) => {
            assert.strictEqual(code, 0);
            // eslint-disable-next-line no-bitwise
            fs.access(outputFilename, fs.constants.F_OK | fs.constants.R_OK, (err) => {
                if (err) {
                    done(err);
                } else {
                    fs.readFile(outputFilename, (readfile_err, data) => {
                        if (readfile_err) done(readfile_err);
                        fs.unlink(outputFilename, (unlink_err) => {
                            if (unlink_err) done(unlink_err);
                        });
                        assert.ok(/^!\[W3C Logo\]\(https:\/\/www\.w3\.org\/Icons\/w3c_home\)$/m.test(data));
                        assert.ok(/^#\s.+\s—\sMinutes$/m.test(data));
                        done();
                    });
                }
            });
        };
        invokeScribeJS(['-o', outputFilename, inputFilename], { exit: resultChecker });
    });

    // [TODO]
});

describe('CGI usage', () => {

    // [TODO]

});

describe('Web interface', () => {

    // [TODO]

});
