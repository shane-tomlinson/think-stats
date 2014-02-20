/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function Stats(options) {
  options = options || {};

  this._raw = [];

  this._sorted = null;
  this.isSorted = false;

  this.min = +Infinity;
  this.max = -Infinity;

  this.compare = options.compare || function(a, b) {
    return a - b;
  };
}

Stats.prototype = {
  push: function(item) {
    if (item.forEach) {
      return item.forEach(this.push.bind(this));
    }

    this._raw.push(item);

    if (item < this.min) {
      this.min = item;
    }

    if (item > this.max) {
      this.max = item;
    }

    this.isSorted = false;

    return this;
  },

  raw: function() {
    return this._raw;
  },

  sorted: function() {
    if (this.isSorted) return this._sorted;

    // sort sorts in lexical order, not numeric order.
    this._sorted = this._raw.sort(function(a, b) {
      return a - b;
    });
    this.isSorted = true;
    return this._sorted;
  },

  hist: function() {
    var hist = {};
    this.raw().forEach(function(value) {
      if (! (value in hist)) {
        return hist[value] = 1;
      }

      hist[value]++;
    });

    return hist;
  },

  frequency: function(value) {
    return this.hist()[value] || 0;
  },

  pmf: function(value1/*, ...*/) {
    var valuesToCalculate = value1.length ? value1 : [].slice.call(arguments, 0);
    return valuesToCalculate.map(function(value) {
      return this.frequency(value) / this._raw.length;
    }, this).reduce(function(total, curr) {
      return total + curr;
    }, 0);
  },

  bucket: function(bucketCount) {
    if (!bucketCount) {
      bucketCount = this.max - this.min;
    }

    if (bucketCount < 1) throw new Error('bucketCount must be >= 1');

    var min = this.min;
    var max = this.max;
    var diff = max - min;

    var bucketSize = diff / bucketCount;

    var buckets = [];
    var lastBucketMax = min;
    var maxBucketIndex = -1;

    // A possibility exists for there to be
    // one more bucket than specified, due to
    // floating point rounding error. We create buckets
    // until we have covered the entire range to ensure
    // all items are bucketed.
    for (var i = 0; lastBucketMax < max; ++i) {
      // do the calculations based on min to minimize floating
      // point rounding error propagation.
      var bucketMin = min + (bucketSize * i);                // inclusive
      var bucketMax = min + (bucketSize * (i + 1));          // non-inclusive
      var bucketMid = (bucketMin + bucketMax) / 2;
      buckets.push({
        count: 0,
        min: bucketMin,
        max: bucketMax,
        bucket: bucketMid
      });

      lastBucketMax = bucketMax;
      maxBucketIndex = i;
    }

    // this is a very very naive implementation. Better would
    // be to sort the array, go to each boundary, find the index,
    // then count the number of items from the previous boundary index.
    this._raw.forEach(function(value) {
      // the last number in the set is included in the last bucket.
      var bucketIndex = Math.min(((value - min) / bucketSize) << 0, maxBucketIndex);
      buckets[bucketIndex].count++;
    });

    return buckets;
  },

  sortedIndexOf: function(valueToFind, start, end) {
    var sorted = this.sorted();

    if (typeof start === 'undefined') start = 0;
    if (typeof end === 'undefined') end = sorted.length - 1;

    // binary search
    var middle = ((end + start) / 2) << 0;
    var middleValue = sorted[middle];

    if (middleValue === valueToFind) {
      var n = middle;
      // find the first index of this value.
      while(sorted[n - 1] === valueToFind) --n;
      return n;
    }

    if (start >= end) return -1;
    if (middleValue < valueToFind) return this.sortedIndexOf(valueToFind, middle + 1, end);
    if (middleValue > valueToFind) return this.sortedIndexOf(valueToFind, start, middle - 1);
  },

  amean: function() {
    if (! this._raw.length) return NaN;

    var total = this._raw.reduce(function(curr, value) {
      return curr + value;
    }, 0);
    return total / this._raw.length;
  },

  median: function() {
    var sorted = this.sorted();
    var middle = sorted.length / 2;
    if (sorted.length % 2) {
      // odd number of elements, return middle element
      return sorted[middle << 0];
    }

    // even number of elements, return the
    // mean of the middle two elements
    var midPlusOneValue = sorted[middle];
    var midMinusOneValue = sorted[middle - 1];
    return (midPlusOneValue + midMinusOneValue) / 2;
  },

  totalSpread: function() {
    var mean = this.amean();
    return this._raw.reduce(function(totalSpread, value) {
      return totalSpread + Math.pow(value - mean, 2);
    }, 0);
  },

  variance: function() {
    if (! this._raw.length) return NaN;

    return this.totalSpread() / this._raw.length;
  },

  sampleVariance: function() {
    if (! this._raw.length || this._raw.length < 2) return NaN;

    return this.totalSpread() / (this._raw.length - 1);
  },

  stddev: function() {
    var variance = this.variance();
    if (isNaN(variance)) return NaN;

    return Math.sqrt(variance);
  },

  /**
   * Find the percentile rank of a value. If value is in list, gives percentile
   * of where item is in list. If item is not in list, returns percentile value
   * of where item would be in the list.
   * @method percentileRank
   */
  percentileRank: function(value) {
    return this.cdf(value) * 100;
  },

  /**
   * Get the value at the specified percentile
   * @method percentile
   */
  percentile: function(percentile) {
    var sorted = this.sorted();
    var percentileIndex = this.percentileIndex(percentile);
    return sorted[percentileIndex];
  },

  /**
   * Get the index of the specified percentile
   * @method percentileIndex
   */
  percentileIndex: function(percentile) {
    var sorted = this.sorted();
    if (! sorted.length) return NaN;
    var percentileIndex = (sorted.length * percentile / 100) << 0;
    return percentileIndex;
  },

  /**
   * Calculate the cumulative probability of a value
   * @method cdf
   * if no value given, return an object with the cdf of all items
   * between (and including) the endpoints of the sorted list.
   */
  cdf: function(value) {
    if (! this._raw.length) return NaN;

    var hist = this.hist();
    var cdfs = {};
    var valuesLessThanOrEqualTo = 0;
    var min = this.min;
    // no need to go past the value if it is specified.
    var max = typeof value !== 'undefined' ? value : this.max;

    // super inefficient, but ah well. Much better if we could
    // http://jsperf.com/sparse-array-iteration-test/2 but items in (for in)
    // are not returned in numeric order.
    for (var i = min; i <= max; ++i) {
      if (hist.hasOwnProperty(i)) {
        valuesLessThanOrEqualTo += (hist[i] || 0);
        cdfs[i] = valuesLessThanOrEqualTo / this._raw.length;
      }
    }

    if (typeof value === 'number') {
      // find the nearest cdf if value does not exist in cdf.
      while (! cdfs.hasOwnProperty(value) && value >= min) {
        value--;
      }

      return cdfs[value] || 0;
    }

    return cdfs;
  }
};

module.exports = Stats;

