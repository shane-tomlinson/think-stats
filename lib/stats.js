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
    insert.call(this, item, 0, this._sorted.length);
    return this;

    // insertion sort.
    function insert(item, start, end) {
      // can't go left or right, insert here.
      if (start >= end) {
        return this._sorted.splice(start, 0, item);
      }

      var midpoint = Math.floor((end + start) / 2);
      var comparison = this.compare(item, this._sorted[midpoint]);
      if ( ! comparison) {
        // a == b, insert now.
        return this._sorted.splice(midpoint, 0, item);
      }
      else if (comparison > 0) {
        // a > b
        return insert.call(this, item, midpoint + 1, end);
      }
      else {
        // a < b
        return insert.call(this, item, start, end - 1);
      }
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

  pmf: function(value) {
    return this.frequency(value) / this._raw.length;
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
  }

};

module.exports = Stats;

