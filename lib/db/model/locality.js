var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var LocalityModel = new Schema();

LocalityModel.add({
  country: String,
  countryCode: String,
  states: [{
    state: String,
    otherNames: [ String ],
    stateCode: String
  }]
});

module.exports = LocalityModel;
