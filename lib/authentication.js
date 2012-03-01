var mongoose = require('mongoose');
var _ = require('underscore');
var async = require('async');
var parallel = async.parallel;
var schema = require('./db/schema');
var User = schema.User;
var Token = schema.Token;
var Thing = schema.Thing;
var config = require('../conf/config');
var passwordUtils = require('../lib/passwordUtils');

function lookupAuthorisationCode(request, cb) {
  cb('lookupAuthorisationCode not_implemented');
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

function lookupRefreshToken(parts, refreshToken, cb) {
  var lookups = accessTokenOwners(parts);
  var calls = {};
  _.each(lookups, function findAccessToken(id, type) {
    calls[type] = function lookupObject(lookupCb) {
      var query = User.findOne({});
      query.where('_id', id);
      query.where('refreshTokens').elemMatch(function (elem) {
        elem.where('token', refreshToken);
        elem.where('expires').gt(new Date());
      });
      query.run(lookupCb);
    };
  });
  parallel(calls, function checkRefreshToken(err, results) {
    if (err) {
      cb(err);
    } else if (!results.user) {
      cb();
    } else {
      cb(null, { doc: results.user, keys: [ 'u', results.user._id ]});
    }
  });
}

function storeAccessToken(accessToken, request, result, cb) {
  var doc = cleanExpiredTokens('apiKeys', result.doc);
  var expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (accessToken.expires_in * 1000));
  var token = new Token({
    token: accessToken.access_token,
    expires: expiryDate
  });
  doc.apiKeys.push(token);
  doc.save(cb);
}

function storeRefreshToken(refreshToken, request, result, cb) {
  var doc = cleanExpiredTokens('refreshTokens', result.doc);
  var expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (refreshToken.expires_in * 1000));
  var token = new Token({
    token: refreshToken.refresh_token,
    expires: expiryDate
  });
  if (request.refresh_token) {
    doc = replaceRefreshToken(request.refresh_token, token, result.doc);
  } else {
    doc.refreshTokens.push(token);
  }
  doc.save(cb);
}

function replaceRefreshToken(refreshToken, newToken, doc) {
  var tokens = doc.refreshTokens;
  var updateMe = _.find(tokens, function checkToken(token) {
    return token.token === refreshToken;
  });
  updateMe.token = newToken.token;
  updateMe.expires = newToken.expires;
  return doc;
}

function cleanExpiredTokens(tokenType, doc) {
  var tokens = doc[tokenType];
  var currentDate = new Date();
  var removeMe = _.filter(tokens, function checkToken(token) {
    return token.expires <= currentDate;
  });
  _.each(removeMe, function remove(element, index) {
    tokens[index].remove();
  });
  return doc;
}

function storeAuthorisationCode(authCode, request, user, cb) {
  cb('storeAuthorisationCode not_implemented');
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
        var workingApiKey = _.find(object.apiKeys, function isWorkingApiKey(apiKey) {
          return apiKey.token === accessToken;
        });
        results[key].workingApiKey = workingApiKey;
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
      var query = User.findOne({});
      query.where('_id', id);
      query.where('apiKeys').elemMatch(function (elem) {
        elem.where('token', accessToken);
        elem.where('expires').gt(new Date());
      });
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
