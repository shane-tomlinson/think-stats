/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');
const JSDOCS_BIN = path.join(__dirname, '..', 'node_modules', '.bin', 'jsdox');

module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('jsdocs', 'Generate documentation - ** run `grunt docs` instead **', function () {
    console.error('path: %s', JSDOCS_BIN);
    grunt.util.spawn({
      cmd: JSDOCS_BIN,
      args: ['--output', 'docs', 'lib/stats.js']
    }, this.async());
  });
};

