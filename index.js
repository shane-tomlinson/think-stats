/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');
const fs = require('fs');
const Promise = require('bluebird');
const Stats = require('./lib/stats');
const range = require('./lib/range');

const PREGNANCY_DATA_PATH = path.join(__dirname, 'data', '2002FemPreg.dat');
const PREGNANCY_RESP_PATH = path.join(__dirname, 'data', '2002FemResp.dat');

const PregnancySchema = {
  'caseid': {
    start: 1,
    end: 12,
    type: Number
  },
  'prglength': {
    start: 275,
    end: 276,
    type: Number
  },
  'outcome': {
    start: 277,
    end: 277,
    type: Number
  },
  'birthord': {
    start: 278,
    end: 279,
    type: Number
  },
  'finalwgt': {
    start: 423,
    end: 440,
    type: Number
  }
};

parseFile(PREGNANCY_DATA_PATH, PregnancySchema)
  .then(function(pregnancies) {
    console.log("Number of pregnancies: %s", pregnancies.length);
    var liveBirths = pregnancies.filter(function(pregnancy) {
      return pregnancy.outcome === 1;
    });

    var firstChildDurations = new Stats();
    var otherChildDurations = new Stats();
    var totalChildDurations = new Stats();

    var firstChildLive = liveBirths.filter(function(pregnancy) {
      return pregnancy.birthord === 1;
    });

    var otherChildLive = liveBirths.filter(function(pregnancy) {
      return pregnancy.birthord !== 1;
    });

    firstChildLive.forEach(function(pregnancy) {
      firstChildDurations.push(pregnancy.prglength);
      totalChildDurations.push(pregnancy.prglength);
    });

    otherChildLive.forEach(function(pregnancy) {
      otherChildDurations.push(pregnancy.prglength);
      totalChildDurations.push(pregnancy.prglength);
    });

    var firstChildTotalWeeks = firstChildLive.reduce(function(total, pregnancy) {
      return total + pregnancy.prglength;
    }, 0);

    var otherChildTotalWeeks = otherChildLive.reduce(function(total, pregnancy) {
      return total + pregnancy.prglength;
    }, 0);

    var firstChildTime = firstChildTotalWeeks / firstChildLive.length;
    var otherChildTime = otherChildTotalWeeks / otherChildLive.length;

    console.log("Number of live births: %s", liveBirths.length);
    console.log("Number of first children live births: %s", firstChildLive.length);
    console.log("Number of second+ live births: %s", otherChildLive.length);
    console.log("Average pregnancy time for first live child: %s", firstChildTime);
    console.log("Average pregnancy time for second+ live child: %s", otherChildTime);
    console.log("Median pregnancy time for first live child: %s", firstChildDurations.median());
    console.log("Median pregnancy time for second+ live child: %s", otherChildDurations.median());
    console.log("amean pregnancy time for first live child: %s", firstChildDurations.amean());
    console.log("amean pregnancy time for second+ live child: %s", otherChildDurations.amean());
    console.log("Difference in hours: %s", Math.abs(firstChildTime - otherChildTime) * 7 * 24);
    console.log("Probability first child is early: %s", firstChildDurations.pmf(range(0, 37)));
    console.log("Probability first child is on time: %s", firstChildDurations.pmf(range(38, 40)));
    console.log("Probability first child is late: %s", firstChildDurations.pmf(range(41, 50)));
    console.log("Probability of week 36: %s", firstChildDurations.pmf(36));
    console.log("Probability of week 37: %s", firstChildDurations.pmf(37));
    console.log("Probability of week 38: %s", firstChildDurations.pmf(38));
    console.log("Probability of week 39: %s", firstChildDurations.pmf(39));
    console.log("Probability of week 40: %s", firstChildDurations.pmf(40));
    console.log("Probability of week 41: %s", firstChildDurations.pmf(41));
    console.log("Probability other child is early: %s", otherChildDurations.pmf(range(0, 37)));
    console.log("Probability other child is on time: %s", otherChildDurations.pmf(range(38, 40)));
    console.log("Probability other child is late: %s", otherChildDurations.pmf(range(41, 50)));

    range(36, 49).forEach(function(weekNumber) {
      console.log("Probability of baby being born in the next week if at week %s: %s",
          weekNumber,
          probabilityOfBeingBornThisWeek(firstChildDurations, weekNumber));
    });

  }).catch(function(err) {
    console.error(String(err));
  });

/*
readDataFileLines(PREGNANCY_RESP_PATH)
  .then(function(lines) {
    console.log("Number of lines: %s", lines.length);
  }).catch(function(err) {
    console.error(String(err));
  });
*/

function probabilityOfBeingBornThisWeek(durations, weekNumber) {
  var firstValueToKeep = durations.sortedIndexOf(weekNumber);
  var unbornChildrenData = durations.sorted().slice(firstValueToKeep);
  var unbornChildrenStats = new Stats();
  unbornChildrenStats.push(unbornChildrenData);
  return unbornChildrenStats.pmf(weekNumber);
}

function readDataFileLines(filePath) {
  var resolver = Promise.defer();

  fs.readFile(filePath, function(err, data) {
    if (err) return resolver.reject(err);

    data = String(data);

    var lines = data.split('\n').filter(function(line) {
      if (line.length) return line;
    });

    resolver.resolve(lines);
  });

  return resolver.promise;
}

function parseFile(fileName, schema) {
  return readDataFileLines(fileName)
    .then(function(lines) {
      var output = lines.map(function(line) {
        return parseLine(line, schema);
      });
      return output;
    }).catch(function(err) {
      console.error(String(err));
    });
}

function parseLine(line, schema) {
  var data = {};

  for (var key in schema) {
    var tuple = schema[key];
    // start and end are defined as 1 based index
    // substr takes number of characters to cut. if end and start are the same,
    // one character is still desired.
    var unconvertedData = line.substr(tuple.start - 1, tuple.end - tuple.start + 1);
    var convertedData = convertItem(unconvertedData, tuple.type);
    data[key] = convertedData;
  }

  return data;
}

function convertItem(unconverted, type) {
  if (type === Number) {
    return parseFloat(unconverted);
  }

  return unconverted;
}

