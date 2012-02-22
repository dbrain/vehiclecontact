var mongoose = require('mongoose');
var _ = require('underscore');
var async = require('async');
var parallel = async.parallel;
var schema = require('./db/schema');
var User = schema.User;
var Thing = schema.Thing;
var config = require('../conf/config');
var passwordUtils = require('../lib/passwordUtils');

function lookupAuthorisationCode(request, cb) {
}

function passwordAuthenticate(request, cb) {
  var query = User.findOne({});
  query.where('username', request.username);
  query.run(function foundUser(err, doc) {
    if (err) {
      cb(err);
    } else if (!doc) {
      cb('User not found.');
    } else {
      function passwordCompare(err, result) {
        if (err) {
          cb(err);
        } else if (result) {
          cb(null, { doc: doc, keys: [ 'u', doc._id ]});
        } else {
          cb('Authentication failed');
        }
      }
      passwordUtils.comparePassword(doc.password, request.password, passwordCompare);
    }
  });
}

function hasClientAuthenticated(request, cb) {
  cb(null, false);
}

function lookupRefreshToken(request, cb) {
}

function storeAccessToken(accessToken, request, result, cb) {
  var doc = result.doc;
  var expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (accessToken.expires_in * 1000));
  var apiKey = {
    token: accessToken.access_token,
    expires: expiryDate
  };
  doc.apiKeys.push(apiKey);
  doc.save(cb);
}

function storeRefreshToken(refreshToken, request, user, cb) {
}

function storeAuthorisationCode(authCode, request, user, cb) {
}

function accessTokenOwners(parts) {
  var keys = parts.keys;
  var pairs = keys.length / 2;
  var lookups = {};
  _.times(pairs, function buildLookup(index) {
    var start = index * 2;
    var end = start + 2;
    var pair = keys.slice(start, end);
    if (pair[0] === 'u') {
      lookups.user = pair[1];
    } else if (pair[0] === 't') {
      lookups.thing = pair[1];
    }
  });
  return lookups;
}

function accessTokenResponseHandler(accessToken, cb) {
  return function handleAccessTokenResponse(err, results) {
    if (err) {
      cb(err);
    } else {
      _.each(results, function highlightAccessToken(object, key) {
        var workingAccessToken;
        _.each(object.apiKeys, function findWorkingAccessToken(apiKey) {
          if (apiKey.access_token === accessToken) {
            workingAccessToken = apiKey;
          }
        });
        results[key].workingAccessToken = workingAccessToken;
      });
      cb(null, results);
    }
  };
}

function lookupAccessToken(parts, accessToken, cb) {
  var lookups = accessTokenOwners(parts);
  var calls = {};
  _.each(lookups, function findAccessToken(id, type) {
    calls[type] = function lookupObject(lookupCb) {
      var object = type === 'user' ? User : Thing;
      var query = object.findOne({});
      query.where('_id', id);
      query.where('apiKeys.token', accessToken);
      query.run(lookupCb);
    };
  });
  parallel(calls, accessTokenResponseHandler(accessToken, cb));
}

exports.lookupAuthorisationCode = lookupAuthorisationCode;
exports.passwordAuthenticate = passwordAuthenticate;
exports.hasClientAuthenticated = hasClientAuthenticated;
exports.lookupRefreshToken = lookupRefreshToken;
exports.storeAccessToken = storeAccessToken;
exports.storeRefreshToken = storeRefreshToken;
exports.storeAuthorisationCode = storeAuthorisationCode;
exports.lookupAccessToken = lookupAccessToken;
