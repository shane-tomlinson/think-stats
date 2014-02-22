/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Stats = require('../lib/stats');
const util = require('util');

const OBJECTS_TO_CREATE = 20;
const VALUES_TO_PUSH = 200000; // 1M
const SPREAD = 100000; // a larger spread uses more memory in array storage.
const STORE_DATA = false;

// basic findings. If values to push is < spread,
// it makes more sense to set store_data to true
// and calculate the histogram rather than the
// other way around.

describe('simple memory test', function() {
  describe('toggle store_data to compare object vs array storage', function() {
    var stats;

    afterEach(function() {
      stats = null;
      console.error(util.inspect(process.memoryUsage()));
    });

    it('test1', function() {
      stats = [];
      for(var j = 0; j < OBJECTS_TO_CREATE; ++j) {
        stats[j] = new Stats({
          store_data: STORE_DATA
        });

        for (var i = 0; i < VALUES_TO_PUSH; ++i) {
          var value = (Math.random() * SPREAD) << 0;
          stats[j].push(value);
        }
      }
    });

    it('test2', function() {
      this.timeout = 20 * 60 * 1000;

      var iterations = 1000;
      next();
      function next() {
        stats = [];
        for(var j = 0; j < OBJECTS_TO_CREATE; ++j) {
          stats[j] = new Stats({
            store_data: STORE_DATA
          });

          for (var i = 0; i < VALUES_TO_PUSH; ++i) {
            var value = (Math.random() * SPREAD) << 0;
            stats[j].push(value);
          }
        }
        iterations--;
        if (!(iterations % 10)) {
          console.error('tick remaining: %s', (iterations / 10) << 0);
        }
        if (iterations > 0) next();
      }
    });
  });

});
