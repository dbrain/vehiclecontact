var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var TokenModel = require('./token');
var UserModel = new Schema();

UserModel.add({
  email: String,
  username: String,
  name: String,
  password: {
    salt: String,
    hash: String
  },
  authorizationCodes: [TokenModel],
  apiKeys: [TokenModel],
  refreshTokens: [TokenModel],
  watching: [ObjectId],
  updatedDate: Date
});

UserModel.pre('save', function preSave(next) {
  this.updatedDate = new Date();
  next();
});

module.exports = UserModel;
