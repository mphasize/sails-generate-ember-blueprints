/*eslint no-process-exit:0*/
'use strict';

var glob  = require('glob');
var Mocha = require('mocha');

var mocha = new Mocha({
  // For some reason, tests take a long time on Windows (or at least AppVeyor)
  timeout: (process.platform === 'win32') ? 30000 : 10000,
  reporter: 'spec'
});

// Determine which tests to run based on argument passed to runner
var arg = process.argv[2];
var root;
var files = '/**/*-test.js';
if (!arg) {
  root = 'tests/{unit,acceptance}';
} else if (arg === 'lint') {
  root = 'tests/unit';
  files = '/lint-test.js';
} else {
  root = 'tests/{unit,acceptance}';
}

function addFiles(mocha, files) {
  glob.sync(root + files).forEach(mocha.addFile.bind(mocha));
}

addFiles(mocha, files);

mocha.run(function (failures) {
  process.on('exit', function () {
    process.exit(failures);
  });
});
