'use strict';

var lint = require('mocha-eslint');

var paths = [
  'bin/index.js',
  'lib',
  'tests'
];

lint(paths);
