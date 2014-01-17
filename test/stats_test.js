/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const Stats = require('../lib/stats');

describe('Stats', function() {
  var stats;

  beforeEach(function() {
    stats = new Stats();
  });

  describe('functions', function() {
    it('push should add items', function() {
      stats.push(3);
      stats.push(5);
      stats.push(1);
      stats.push(6);
      stats.push(-1);
      stats.push(6);

      var raw = stats.raw();
      assert.deepEqual(raw, [3, 5, 1, 6, -1, 6]);

      var sorted = stats.sorted();
      assert.deepEqual(sorted, [-1, 1, 3, 5, 6, 6]);
    });

    it('2nd number less than first', function() {
      stats.push(3);
      stats.push(-1);
      stats.push(2);
      stats.push(0);

      var raw = stats.raw();
      assert.deepEqual(raw, [3, -1, 2, 0]);

      var sorted = stats.sorted();
      assert.deepEqual(sorted, [-1, 0, 2, 3]);
    });

    it('2nd equal to first', function() {
      stats.push(3);
      stats.push(3);
      stats.push(2);
      stats.push(0);
      stats.push(3);

      var raw = stats.raw();
      assert.deepEqual(raw, [3, 3, 2, 0, 3]);

      var sorted = stats.sorted();
      assert.deepEqual(sorted, [0, 2, 3, 3, 3]);
    });

    it('push can take an array', function() {
      stats.push([3, -1, 2, 0]);

      var raw = stats.raw();
      assert.deepEqual(raw, [3, -1, 2, 0]);

      var sorted = stats.sorted();
      assert.deepEqual(sorted, [-1, 0, 2, 3]);
    });
  });
});
