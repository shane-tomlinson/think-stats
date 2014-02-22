/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('chai').assert;
const Stats = require('../lib/stats');

describe('Stats->', function() {
  var stats;

  describe('with store_data', function() {
    beforeEach(function() {
      stats = new Stats({
        store_data: true
      });
    });

    describe('push', function() {
      it('should add items', function() {
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

      it('can take an array', function() {
        stats.push([3, -1, 2, 0]);

        var raw = stats.raw();
        assert.deepEqual(raw, [3, -1, 2, 0]);

        var sorted = stats.sorted();
        assert.deepEqual(sorted, [-1, 0, 2, 3]);
      });
    });

    describe('bucket', function() {
      it('no bucket count given - create separate buckets for each whole value', function() {
        stats.push([-1, 0, 1, 2, 3, 4, 6, 8, 9]);

        var buckets = stats.bucket();

        assert.equal(buckets.length, 10);
        assert.equal(buckets[9].count, 2);
        assert.equal(buckets[9].min, 8);
        assert.equal(buckets[9].max, 9);
      });

      it('bucket items, return an array of buckets', function() {
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
    });

    describe('hist', function() {
      it('find the histogram of a set of values', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        var hist = stats.hist();

        assert.equal(hist[1], 4);
        assert.equal(hist[-1], 1);
      });
    });

    describe('frequency', function() {
      it('count the number of times an item is in the list', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        assert.equal(stats.frequency(1), 4);
        assert.equal(stats.frequency(0), 1);
        assert.equal(stats.frequency(5), 0);
      });
    });

    describe('pmf', function() {
      it('return the probability of a value', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        assert.equal(stats.pmf(1), 4/12);
        assert.equal(stats.pmf(0), 1/12);
        assert.equal(stats.pmf(5), 0);
      });

      it('several values - return the sum the pmf of the values', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        // allow for floating point precision errors.
        assert.equal(stats.pmf(1, 0, 5).toFixed(4), (5/12).toFixed(4));
      });

      it('an array of values - sum the values of the pmf', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        // allow for floating point precision errors.
        assert.equal(stats.pmf([1, 0, 5]).toFixed(4), (5/12).toFixed(4));
      });
    });

    describe('sortedIndexOf', function() {
      it('find the first index of an item', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        assert.equal(stats.sortedIndexOf(1), 2);
        assert.equal(stats.sortedIndexOf(3), 7);
        assert.equal(stats.sortedIndexOf(5), -1);
        assert.equal(stats.sortedIndexOf(-2), -1);
        assert.equal(stats.sortedIndexOf(10), -1);
      });
    });

    describe('amean', function() {
      it('calculate the arithmetic mean', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        assert.equal(stats.amean().toFixed(4), 2.9167);
      });
    });

    describe('median', function() {
      it('can handle an odd number of elements', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8]);
        assert.equal(stats.median(), 1);
      });

      it('can handle an even number of elements', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.median(), 1.5);
      });
    });

    describe('variance', function() {
      it('caluclate the squared deviation from the mean', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.variance().toFixed(4), 9.4097);
      });
    });

    describe('sampleVariance', function() {
      it('caluclate the sample variance', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.sampleVariance().toFixed(4), 10.2652);
      });
    });

    describe('stddev', function() {
      it('caluclate the standard deviation', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.stddev().toFixed(4), 3.0675);
      });
    });

    describe('percentileRank', function() {
      it('finds the percentile rank of a value', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(Math.floor(stats.percentileRank(6)), 83);
      });

      it('finds the percentile rank of a value not in the list', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(Math.floor(stats.percentileRank(5)), 75);
      });

      it('returns NaN if there are no values in list', function() {
        assert.isTrue(isNaN(stats.percentileRank(5)));
      });
    });

    describe('percentile', function() {
      it('finds the nearest value less than the percentile', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.percentile(75), 6);
      });
    });

    describe('cdf', function() {
      it('calculates the cumulative probability of an item', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.cdf(6).toFixed(4), .8333);
      });

      it('check with book', function () {
        stats.push([1, 2, 2, 3, 5])
        assert.equal(stats.cdf(1), 0.2);
        assert.equal(stats.cdf(2), 0.6);
        assert.equal(stats.cdf(3), 0.8);
        assert.equal(stats.cdf(5), 1);
      });

      it('if value is not in the list, calculate it', function() {
        stats.push([1, 2, 2, 3, 5])
        assert.equal(stats.cdf(0), 0);
        assert.equal(stats.cdf(4), 0.8);
        assert.equal(stats.cdf(6), 1);
      });

      it('if no value specified, returns a "sparse array" of all cdfs', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        var cdfs = stats.cdf();
        assert.equal(cdfs[-1], 1/12);
        assert.equal(cdfs[0], 2/12);
        assert.equal(cdfs[1], 6/12);
        assert.equal(cdfs[6], 10/12);
        assert.isUndefined(cdfs[5]);
      });

      it('check with book for array', function() {
        stats.push([1, 2, 2, 3, 5])
        var cdfs = stats.cdf();
        assert.equal(cdfs[1], 0.2);
        assert.equal(cdfs[2], 0.6);
        assert.equal(cdfs[3], 0.8);
        assert.equal(cdfs[5], 1);
        assert.isUndefined(cdfs[4]);
      });
    });
  });

  describe('store_data: false', function () {
    beforeEach(function() {
      stats = new Stats({
        store_data: false
      });
    });

    describe('push', function() {
      it('should add items', function() {
        stats.push(3);
        stats.push(5);
        stats.push(1);
        stats.push(6);
        stats.push(-1);
        stats.push(6);

        // cannot retrieve raw data if data is not stored.
        var err;
        try {
          var raw = stats.raw();
        } catch(e) {
          err = e;
        }
        assert.equal(err.message, 'raw data is not saved');

        var sorted = stats.sorted();
        assert.deepEqual(sorted, [-1, 1, 3, 5, 6, 6]);
      });
    });

    describe('hist', function() {
      it('find the histogram of a set of values', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        var hist = stats.hist();

        assert.equal(hist[1], 4);
        assert.equal(hist[-1], 1);
      });
    });

    describe('frequency', function() {
      it('count the number of times an item is in the list', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        assert.equal(stats.frequency(1), 4);
        assert.equal(stats.frequency(0), 1);
        assert.equal(stats.frequency(5), 0);
      });
    });

    describe('pmf', function() {
      it('return the probability of a value', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        assert.equal(stats.pmf(1), 4/12);
        assert.equal(stats.pmf(0), 1/12);
        assert.equal(stats.pmf(5), 0);
      });

      it('several values - return the sum the pmf of the values', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        // allow for floating point precision errors.
        assert.equal(stats.pmf(1, 0, 5).toFixed(4), (5/12).toFixed(4));
      });

      it('an array of values - sum the values of the pmf', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        // allow for floating point precision errors.
        assert.equal(stats.pmf([1, 0, 5]).toFixed(4), (5/12).toFixed(4));
      });
    });

    describe('sortedIndexOf', function() {
      it('find the first index of an item', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        assert.equal(stats.sortedIndexOf(1), 2);
        assert.equal(stats.sortedIndexOf(3), 7);
        assert.equal(stats.sortedIndexOf(5), -1);
        assert.equal(stats.sortedIndexOf(-2), -1);
        assert.equal(stats.sortedIndexOf(10), -1);
      });
    });

    describe('amean', function() {
      it('calculate the arithmetic mean', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);

        assert.equal(stats.amean().toFixed(4), 2.9167);
      });
    });

    describe('median', function() {
      it('can handle an odd number of elements', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8]);
        assert.equal(stats.median(), 1);
      });

      it('can handle an even number of elements', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.median(), 1.5);
      });
    });

    describe('variance', function() {
      it('caluclate the squared deviation from the mean', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.variance().toFixed(4), 9.4097);
      });
    });

    describe('sampleVariance', function() {
      it('caluclate the sample variance', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.sampleVariance().toFixed(4), 10.2652);
      });
    });

    describe('stddev', function() {
      it('caluclate the standard deviation', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.stddev().toFixed(4), 3.0675);
      });
    });

    describe('percentileRank', function() {
      it('finds the percentile rank of a value', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(Math.floor(stats.percentileRank(6)), 83);
      });

      it('finds the percentile rank of a value not in the list', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(Math.floor(stats.percentileRank(5)), 75);
      });

      it('returns NaN if there are no values in list', function() {
        assert.isTrue(isNaN(stats.percentileRank(5)));
      });
    });

    describe('percentile', function() {
      it('finds the nearest value less than the percentile', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.percentile(75), 6);
      });
    });

    describe('cdf', function() {
      it('calculates the cumulative probability of an item', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        assert.equal(stats.cdf(6).toFixed(4), .8333);
      });

      it('check with book', function () {
        stats.push([1, 2, 2, 3, 5])
        assert.equal(stats.cdf(1), 0.2);
        assert.equal(stats.cdf(2), 0.6);
        assert.equal(stats.cdf(3), 0.8);
        assert.equal(stats.cdf(5), 1);
      });

      it('if value is not in the list, calculate it', function() {
        stats.push([1, 2, 2, 3, 5])
        assert.equal(stats.cdf(0), 0);
        assert.equal(stats.cdf(4), 0.8);
        assert.equal(stats.cdf(6), 1);
      });

      it('if no value specified, returns a "sparse array" of all cdfs', function() {
        stats.push([-1, 0, 1, 2, 1, 1, 1, 3, 4, 6, 8, 9]);
        var cdfs = stats.cdf();
        assert.equal(cdfs[-1], 1/12);
        assert.equal(cdfs[0], 2/12);
        assert.equal(cdfs[1], 6/12);
        assert.equal(cdfs[6], 10/12);
        assert.isUndefined(cdfs[5]);
      });

      it('check with book for array', function() {
        stats.push([1, 2, 2, 3, 5])
        var cdfs = stats.cdf();
        assert.equal(cdfs[1], 0.2);
        assert.equal(cdfs[2], 0.6);
        assert.equal(cdfs[3], 0.8);
        assert.equal(cdfs[5], 1);
        assert.isUndefined(cdfs[4]);
      });
    });
  });

});
