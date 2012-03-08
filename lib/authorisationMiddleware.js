var _  = require('underscore');

var authorisations = {
  'GET /user/watching': { user: true },
  'PUT /rego': { user: true },
  'PUT /rego/:country/:state/:rego/watchers': { user: true },
  'PUT /rego/:country/:state/:rego/conversations': { user: true }
};
var regexLookupTable = [];
(function buildLookupTable() {
  _.each(authorisations, function (validator, key) {
    var newKey = '^' + key.replace(/\:[^\/]+/g, '[^/]+') + '$';
    regexLookupTable.push({ key: newKey, authorisation: validator });
  })
})();

function findAuthorisation(url) {
  var item = _.find(regexLookupTable, function check(item) {
    return url.match(item.key);
  });
  return item ? item.authorisation : null;
}

function requestParser(options) {
  return function parseRequest(req, res, next) {
    var authorisation = findAuthorisation(req.method + ' ' + req.path);
    if (authorisation) {
      if (checkAuthorisation(req, authorisation)) {
        next();
      } else {
        res.send('You do not have access to this call.', 403);
      }
    } else {
      next();
    }
  };
}

function checkAuthorisation(req, authorisation) {
  var result = true;
  if (authorisation.user) {
    result = checkUser(req, authorisation);
  }
  return result;
}

function checkUser(req, authorisation) {
  if (authorisation.user && !req.user) {
    return false;
  }
  return true;
}

exports.requestParser = requestParser;
