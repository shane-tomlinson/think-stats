/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function Stats(options) {
  options = options || {};

  var storeData = options.store_data || false;
  if (options.compare) {
    this.compare = options.compare;
  }

  // Object.defineProperty used to prevent
  // "private" values from being iterated.
  if (storeData) {
    Object.defineProperty(this, '_raw', {
      value: [],
      enumerable: false,
      writable: true,
      configurable: false
    });
  } else {
    Object.defineProperty(this, '_histogram', {
      value: {},
      enumerable: false,
      writable: true,
      configurable: false
    });
  }

  Object.defineProperties(this, {
    '_sorted': {
      value: {},
      enumerable: false,
      writable: true,
      configurable: false
    }});
}

Stats.prototype = {
  length: 0,
  min: +Infinity,
  max: -Infinity,

  /**
   * Numerically compare a and b. Can be overridden
   * by passing in `compare` option to constructor.
   *
   * @method compare
   * @return 0 if a === b
   *       < 0 if a < b
   *       > 0 if a > b
   */
  compare: function(a, b) {
    return a - b;
  },

  /**
   * Call when no longer needed. Free references.
   *
   * @method destroy
   */
  destroy: function () {
    this._raw = this._sorted = this._histogram = this.compare = null;
  },

  /**
   * Add a value or an array of values
   *
   * @method push
   */
  push: function (value) {
    if (value.forEach) {
      return value.forEach(this.push, this);
    }

    if (this._raw) {
      this._raw.push(value);
    } else if (this._histogram) {
      if (! (value in this._histogram)) {
        this._histogram[value] = 0;
      }
      this._histogram[value]++;
    }

    if (this.compare(value, this.min) < 0) {
      this.min = value;
    }

    if (this.compare(value, this.max) > 0) {
      this.max = value;
    }

    this._sorted = null;

    this.length++;
  },

  /**
   * Retrieve raw data. Only available if `store_data` option is passed
   * in options to constructor.
   *
   * @method raw
   * @return Array of values
   */
  raw: function () {
    if (! this._raw) throw new Error('raw data is not saved');
    return this._raw;
  },

  /**
   * Retrieve sorted values.
   *
   * @method sorted
   * @return Array of values
   */
  sorted: function () {
    if (this._sorted) return this._sorted;

    // sort sorts in lexical order, not numeric order.
    if (this._raw) {
      this._sorted = this._raw.sort(this.compare);
    } else {
      this._sorted = [];

      // XXX horribly inefficient if there is a
      // large spread and many gaps, but oh well.
      for (var i = this.min; i <= this.max; ++i) {
        var frequency = this._histogram[i] || 0;
        while (frequency) {
          this._sorted.push(i);
          frequency--;
        }
      }
    }
    return this._sorted;
  },

  /**
   * Retrieve a histogram of the data.
   *
   * stats.push([1,1,3]);
   * var hist = stats.hist();
   * hist[1] === 2;
   * hist[3] === 1;
   *
   * @method hist
   * @return Object
   *    Keys are unique values added via push.
   *    Values are count
   */
  hist: function () {
    if (this._histogram) return this._histogram;

    var hist = {};
    this.raw().forEach(function (value) {
      if (! (value in hist)) {
        return hist[value] = 1;
      }

      hist[value]++;
    });

    return hist;
  },

  /**
   * Retrieve the number of times a value has been added.
   *
   * @method frequency
   * @return Number
   */
  frequency: function (value) {
    return this.hist()[value] || 0;
  },

  /**
   * Retrieve a list of unique values.
   *
   * @method unique
   * @return Array of values
   */
  unique: function() {
    return Object.keys(this.hist());
  },

  /**
   * Calculate the Probability Mass Function of a set of values.
   *
   * @method pmf
   */
  pmf: function (value1/*, ..*/) {
    var valuesToCalculate = value1.length ? value1 : [].slice.call(arguments, 0);
    return valuesToCalculate.map(function (value) {
      return this.frequency(value) / this.length;
    }, this).reduce(function (total, curr) {
      return total + curr;
    }, 0);
  },

  /**
   * @deprecated
   */
  distribution: function() {
    return this.bucket(25);
  },

  /**
   * Calculate a set of buckets from the data.
   *
   * @method bucket
   * @return Array of buckets. Each bucket contains:
   *          `count` - number of items in bucket
   *          `min` - bucket lower boundary
   *          `max` - bucket upper boundary
   *          `bucket` - bucket midpoint
   */
  bucket: function (bucketCount) {
    if (! bucketCount) {
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
    var i = 0;
    do {
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
      ++i;
    } while(lastBucketMax < max);

    // this is a very very naive implementation. Better would
    // be to sort the array, go to each boundary, find the index,
    // then count the number of items from the previous boundary index.
    if (this._raw) {
      this._raw.forEach(function (value) {
        // the last number in the set is included in the last bucket.
        var bucketIndex = Math.min(((value - min) / bucketSize) << 0, maxBucketIndex);
        var bucket = buckets[bucketIndex];
        bucket.count++;
      });
    } else {
      for (var value in this._histogram) {
        var bucketIndex = Math.min(((+value - min) / bucketSize) << 0, maxBucketIndex);
        var bucket = buckets[bucketIndex];
        bucket.count += this._histogram[value];
      }
    }

    return buckets;
  },

  /**
   * @deprecated
   */
  sortedIndexOf: function (valueToFind, start, end) {
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

  /**
   * Calculate the arithmetic mean.
   *
   * @method amean
   * @return Number
   */
  amean: function () {
    if (! this.length) return NaN;

    var total;
    if (this._raw) {
      total = this._raw.reduce(function (curr, value) {
        return curr + value;
      }, 0);
    } else {
      total = 0;
      for (var value in this._histogram) {
        total += (this._histogram[value] * parseInt(value, 10));
      }
    }
    return total / this.length;
  },

  /**
   * Calculate the median.
   *
   * @method median
   * @return Number
   */
  median: function () {
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

  /**
   * Calculate the total spread.
   *
   * @method totalSpread
   * @return Number
   */
  totalSpread: function () {
    var mean = this.amean();
    if (this._raw) {
      return this._raw.reduce(function (totalSpread, value) {
        return totalSpread + Math.pow(value - mean, 2);
      }, 0);
    } else {
      var spread = 0;
      for (var value in this._histogram) {
        var frequency = this._histogram[value];
        value = parseInt(value, 10);
        spread += (frequency * Math.pow(value - mean, 2));
      }

      return spread;
    }
  },

  /**
   * Calculate the variance.
   *
   * @method variance
   * @return Number
   */
  variance: function () {
    if (! this.length) return NaN;

    return this.totalSpread() / this.length;
  },

  /**
   * Calculate the sample variance.
   *
   * @method sampleVariance
   * @return Number
   */
  sampleVariance: function () {
    if (! this.length || this.length < 2) return NaN;

    return this.totalSpread() / (this.length - 1);
  },

  /**
   * Retreive the range of values.
   *
   * @method range
   * @return Array - [min, max]
   */
  range: function () {
    return [this.min, this.max];
  },

  /**
   * Calculate the standard deviation.
   *
   * @method stddev
   * @return Number
   */
  stddev: function () {
    var variance = this.variance();
    if (isNaN(variance)) return NaN;

    return Math.sqrt(variance);
  },

  /**
   * Calculate the percentile rank of a value.
   *
   * @method percentileRank
   * @return Number
   *  If value is in list, percentile of where item is in list.
   *  If item is not in list, percentile of where item would be.
   */
  percentileRank: function (value) {
    return this.cdf(value) * 100;
  },

  /**
   * Retreive the value at the specified percentile.
   *
   * @method percentile
   * @return Number
   */
  percentile: function (percentile) {
    var sorted = this.sorted();
    var percentileIndex = this.percentileIndex(percentile);
    return sorted[percentileIndex];
  },

  /**
   * Retreive the index of the specified percentile.
   *
   * @method percentileIndex
   * @return Number
   */
  percentileIndex: function (percentile) {
    var sorted = this.sorted();
    if (! sorted.length) return NaN;
    var percentileIndex = (sorted.length * percentile / 100) << 0;
    return percentileIndex;
  },

  /**
   * Calculate the Cumulative Distribution Function of a value.
   *
   * @method cdf
   * @return Number if value is given
   *         Object if no value given. Object contains the cdf of all values
   *           between (and including) the endpoints of the sorted list.
   */
  cdf: function (value) {
    if (! this.length) return NaN;

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
        cdfs[i] = valuesLessThanOrEqualTo / this.length;
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

