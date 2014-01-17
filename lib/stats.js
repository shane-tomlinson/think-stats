/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function Stats(options) {
  options = options || {};

  this._raw = [];
  this._data = [];

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
    insert.call(this, item, 0, this._data.length);
    return this;

    // insertion sort.
    function insert(item, start, end) {
      // can't go left or right, insert here.
      if (start >= end) {
        return this._data.splice(start, 0, item);
      }

      var midpoint = Math.floor((end + start) / 2);
      /*
      console.log('value: %s, start: %s, end: %s, midpoint: %s',
              item, start, end, midpoint);
      */

      var comparison = this.compare(item, this._data[midpoint]);
      if ( ! comparison) {
        // a == b, insert now.
        return this._data.splice(midpoint, 0, item);
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
    return this._data;
  }
};

module.exports = Stats;

