var mongoose = require('mongoose');
var schema = require('./db/schema');
var User = schema.User;
var passwordUtils = require('./passwordUtils');
var series = require('async').series;
var validator = require('./validator');
var authentication = require('./authentication');
var config = require('../conf/config');
var oauthHelper = require('oauth2-helper').helper(authentication, config.oauth);

function oauth(request, cb) {
  oauthHelper.request(request, cb);
}

function lookupAccessToken(accessToken, cb) {
  oauthHelper.lookupAccessToken(accessToken, cb);
}

function createUser(newUser, cb) {
  var steps = {
    validate: function validate(validateCb) {
      validator.validateUserCreate(newUser, validateCb)
    },
    passwordHash: function hashPassword(passwordCb) {
      passwordUtils.hashPassword(newUser.password, passwordCb);
    }
  };

  function makeTheMagicHappen(err, results) {
    if (err) {
      cb(err);
    } else {
      var user = new User({
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        password: results.passwordHash
      });
      user.save(function saveUserResult(err) {
        cb(err, user);
      });
    }
  }

  series(steps, makeTheMagicHappen);
}

exports.createUser = createUser;
exports.oauth = oauth;
exports.lookupAccessToken = lookupAccessToken;
