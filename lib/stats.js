/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function Stats(options) {
  options = options || {};

  this._raw = [];
  this._sorted = [];

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
    var insertionIndex = this.insertionIndex(item);
    this._sorted.splice(insertionIndex, 0, item);
    return this;
  },

  // Find where an item would be inserted.
  // start is inclusive, end is exclusive.
  insertionIndex: function(item, start, end) {
    if (typeof start === 'undefined') start = 0;
    if (typeof end === 'undefined') end = this._sorted.length;

    // can't go left or right, insert here.
    if (start >= end) {
      return start;
    }

    var midpoint = Math.floor((end + start) / 2);
    var comparison = this.compare(item, this._sorted[midpoint]);
    if ( ! comparison) {
      // a === b, insert now.
      return midpoint;
    }
    else if (comparison > 0) {
      // a > b
      return this.insertionIndex(item, midpoint + 1, end);
    }
    else {
      // a < b
      return this.insertionIndex(item, start, midpoint);
    }
  },

  raw: function() {
    return this._raw;
  },

  sorted: function() {
    return this._sorted;
  },

  hist: function() {
    var hist = {};
    this._sorted.forEach(function(value) {
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
      bucketCount = this._sorted[this._sorted.length - 1] - this._sorted[0];
    }

    var maxBucketIndex = bucketCount - 1;

    // the offsets are to ensure the endpoints are included.
    var min = this._sorted[0];
    var max = this._sorted[this._sorted.length - 1];
    var diff = max - min;

    var bucketSize = diff / bucketCount;

    var currBucket = 0;

    var buckets = [];
    for (var i = 0; i < bucketCount; ++i) {
      buckets.push({
        count: 0,
        min: min + (bucketSize * i),                // inclusive
        max: min + (bucketSize * (i + 1))           // non-inclusive
      });
    }

    // this is a very very naive implementation. Better would
    // be to go to each boundary, find the index, then count the number of
    // items from the previous boundary index.
    this._sorted.forEach(function(value) {
      // the last number in the set is included in the last bucket.
      var bucketIndex = Math.min(Math.floor((value - min) / bucketSize), maxBucketIndex);
      buckets[bucketIndex].count++;
    });

    return buckets;
  },

  sortedIndexOf: function(valueToFind, start, end) {
    if (typeof start === 'undefined') start = 0;
    if (typeof end === 'undefined') end = this._sorted.length - 1;

    // binary search
    var middle = Math.floor((end + start) / 2);
    var middleValue = this._sorted[middle];

    if (middleValue === valueToFind) {
      var n = middle;
      // find the first index of this value.
      while(this._sorted[n - 1] === valueToFind) --n;
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
    var middle = this._sorted.length / 2;
    if (this._sorted.length % 2) {
      // odd number of elements, return middle element
      return this._sorted[Math.floor(middle)];
    }

    // even number of elements, return the
    // mean of the middle two elements
    var middle = this._sorted.length / 2;
    var midPlusOneValue = this._sorted[middle];
    var midMinusOneValue = this._sorted[middle - 1];
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
    if (! this._sorted.length) return NaN;
    var percentileIndex = Math.floor(this._sorted.length * percentile / 100);
    return this._sorted[percentileIndex];
  },

  /**
   * Calculate the cumulative probability of a value
   * @method cdf
   * if no value given, return an object with the cdf of all items
   * between (and including) the endpoints of the sorted list.
   */
  cdf: function(value) {
    if (! this._sorted.length) return NaN;

    var hist = this.hist();
    var cdfs = {};
    var valuesLessThanOrEqualTo = 0;
    var min = this._sorted[0];
    // no need to go past the value if it is specified.
    var max = typeof value !== 'undefined' ? value : this._sorted[this._sorted.length - 1];
    for(var i = min; i <= max; ++i) {
      valuesLessThanOrEqualTo += (hist[i] || 0);
      cdfs[i] = valuesLessThanOrEqualTo / this._sorted.length;
    }

    if (typeof value !== 'undefined')
      return cdfs[value];

    return cdfs;
  }
};

module.exports = Stats;

