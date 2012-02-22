var authorisations = {
};

function requestParser(options) {
  return function parseRequest(req, res, next) {
    var authorisation = authorisations[req.url];
    if (authorisation) {
      if (checkAuthorisation(req, authorisation)) {
        next();
      } else {
        res.send(403, 'You do not have access to this call.');
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
  return true;
}

function checkThing(req, authorisation) {
  return true;
}

exports.requestParser = requestParser;
