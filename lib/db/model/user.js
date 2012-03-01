var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var UserModel = new Schema();

UserModel.add({
  email: String,
  username: String,
  name: String,
  password: {
    salt: String,
    hash: String
  },
  authorizationCodes: [{
    code: String,
    expires: Date
  }],
  apiKeys: [{
    token: String,
    expires: Date
  }],
  refreshTokens: [{
    token: String,
    expires: Date
  }],
  updatedDate: Date
});

UserModel.pre('save', function preSave(next) {
  this.updatedDate = new Date();
  next();
});

module.exports = UserModel;
