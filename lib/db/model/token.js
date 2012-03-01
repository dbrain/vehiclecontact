var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var TokenModel = new Schema();

TokenModel.add({
  token: String,
  expires: Date
});

module.exports = TokenModel;
