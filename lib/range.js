/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// create an array containing values from start to end, inclusive.
module.exports = function(start, end) {
  var curr = start;
  var values = [];

  while (curr <= end) {
    values.push(curr);
    curr++;
  }

  return values;
};
