var mongoose = require('mongoose');
var Locality = require('./db/schema').Locality;
var config = require('../conf/config');
var csv = require('csv');
var path = require('path');
var _ = require('underscore');

function importIfMissing() {
  mongoose.connect(config.mongo.uri);
  Locality.count().exec(function localityCountResponse(err, count) {
    if (err) {
      console.log('Error counting localities', err);
    } else if (count > 1) {
      console.log('Localities already imported.');
    } else {
      importLocalities();
    }
  });
}

function importLocalities() {
  var localities = {};
  var loggedFirstRow = false;
  csv()
  .fromPath(path.resolve(__dirname, '../files/country_csv_2012-03-15_no_header.txt'), {
    columns: [
      'country',
      'subdivisionStatecode',
      'state',
      'type',
      'alternateNames',
      'subdivisionStatecodeStarred',
      'cdhId',
      'countryCdhId',
      'countryCode2',
      'countryCode3'
    ]
  })
  .on('data', function handleRow(row) {
    if (row.countryCode2 && row.country && (row.state || row.alternateNames) && row.subdivisionStatecode) {
      var locality = localities[row.countryCode2] || {};
      if (locality.country && (row.country != locality.country)) {
        console.log('Possible clash between ' + row.country + ' and ' + locality.country);
      }
      locality.country = trimAllTheThings(row.country);
      locality.countryCode = trimAllTheThings(row.countryCode2).toLowerCase();
      locality.states = locality.states || [];
      var state = trimAllTheThings(row.state ? row.state : row.alternateNames.split(',')[0]);

      locality.states.push({
        state: state,
        stateCode: trimAllTheThings(row.subdivisionStatecode.split('-')[1]).toLowerCase(),
        otherNames: row.alternateNames ? _.map(row.alternateNames.split(','), trimAllTheThings) : undefined
      });

      localities[row.countryCode2] = locality;
    } else {
      console.log("Row with no country code, country or state", row);
    }
  })
  .on('end', function handleEnd(count) {
    save(localities);
  })
  .on('error', function handleError(error) {
    console.log('Error parsing CSV', error);
  })
}

function trimAllTheThings(text) {
  if (text) {
    return text.replace(/^\s+/, '').replace(/\s+$/, '');
  } else {
    return '';
  }
}

function save(localities) {
  _.each(localities, function processLocality(locality) {
    new Locality({
      country: locality.country,
      countryCode: locality.countryCode,
      states: locality.states
    }).save(function saveResult(err) {
      if (err) {
        console.log('Error saving locality ' + locality.country, err);
      }
    });
  });
}

exports.importIfMissing = importIfMissing;
