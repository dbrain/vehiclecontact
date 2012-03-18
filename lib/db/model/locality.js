var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var LocalityModel = new Schema();

LocalityModel.add({
  country: { type: String, index: { unique: true } },
  countryCode: String,
  states: [{
    state: String,
    otherNames: [ String ],
    stateCode: String
  }]
});
LocalityModel.index({ country: 1, 'states.stateCode': 1 }, { unique: true });

module.exports = LocalityModel;
