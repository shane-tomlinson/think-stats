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

    it('bucket - no bucket count given', function() {
      stats.push([-1, 0, 1, 2, 3, 4, 6, 8, 9]);

      var buckets = stats.bucket();

      assert.equal(buckets.length, 10);
      assert.equal(buckets[9].count, 2);
      assert.equal(buckets[9].min, 8);
      assert.equal(buckets[9].max, 9);
    });

    it('bucket - bucket items, return an array of buckets', function() {
      stats.push([-1, 0, 1, 2, 3, 4, 6, 8, 9]);

      var buckets = stats.bucket(3);

      var firstBucket = buckets[0];
      /*assert.equal(firstBucket.min, -1);*/
      /*assert.equal(firstBucket.max, 3);*/
      assert.equal(firstBucket.count, 4);

      var secondBucket = buckets[1];
      /*assert.equal(secondBucket.min, 3);*/
      /*assert.equal(secondBucket.max, 7);*/
      assert.equal(secondBucket.count, 2);
    });

    it('hist - find the histogram of a set of values', function() {
      stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

      var hist = stats.hist();

      assert.equal(hist[1], 4);
      assert.equal(hist[-1], 1);
    });

    it('frequency - count the number of times an item is in the list', function() {
      stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

      assert.equal(stats.frequency(1), 4);
      assert.equal(stats.frequency(0), 1);
      assert.equal(stats.frequency(5), 0);
    });

    it('pmf - normalize the histogram', function() {
      stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

      assert.equal(stats.pmf(1), 4/12);
      assert.equal(stats.pmf(0), 1/12);
      assert.equal(stats.pmf(5), 0);
    });

    it('sortedIndexOf - find the first index of an item', function() {
      stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

      assert.equal(stats.sortedIndexOf(1), 2);
      assert.equal(stats.sortedIndexOf(3), 7);
      assert.equal(stats.sortedIndexOf(5), -1);
      assert.equal(stats.sortedIndexOf(-2), -1);
      assert.equal(stats.sortedIndexOf(10), -1);
    });

  });
});
