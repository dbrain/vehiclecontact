var api = require('./api');
var _ = require('underscore');

function requestParser(options) {
  return function parseRequest(req, res, next) {
    if (req.url.indexOf('/oauth') === 0) {
      api.oauth(req.body, handleOAuthResponse(res, next));
    } else {
      getTokenDetails(req, nexty(next));
    }
  };
}

function tokenDetailsResponseHandler(req, cb) {
  return function handleTokenDetailsResponse(err, result) {
    if (err) {
      cb(err);
    } else {
      _.each(result, function tokenDetail(doc, key) {
        req[key] = doc;
      });
      cb();
    }
  };
}

function getTokenDetails(req, cb) {
  var authorisation = req.header('Authorization');
  var paramToken = req.param('access_token');
  if (authorisation || paramToken) {
    if ((authorisation && authorisation.indexOf('Bearer') !== -1) || paramToken) {
      getBearerTokenDetails(authorisation, paramToken, tokenDetailsResponseHandler(req, cb));
    } else {
      process.nextTick(cb);
    }
  } else {
    process.nextTick(cb);
  }
}

function getBearerTokenDetails(auth, paramToken, cb) {
  var accessToken;
  if (auth) {
    var authSplit = auth.split(' ');
    if (authSplit.length > 1) {
      accessToken = authSplit[1];
    }
  }
  accessToken = accessToken || paramToken;
  api.lookupAccessToken(accessToken, cb);
}

function handleOAuthResponse(res, next) {
  return function handleResponse(err, result) {
    if (err) {
      next(err);
    } else {
      res.send(result);
    }
  }
}

function nexty(next) {
  return function handleResponse(err, result) {
    if (err) {
      next(err);
    } else {
      next();
    }
  }
}

exports.requestParser = requestParser;
