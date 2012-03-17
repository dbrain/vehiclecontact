var schema = require('./db/schema');
var User = schema.User;
var Rego = schema.Rego;
var Locality = schema.Locality;
var _ = require('underscore');

function alreadyWatching(validationResults) {
  validationResults.count++;
  validationResults.errors.push({
    code: 'already_watching',
    message: 'You are already watching this rego.'
  });
}

function alreadyInUse(field, niceName, validationResults) {
  validationResults.count++;
  validationResults.errors.push({
    field: field,
    code: 'already_in_use',
    message: 'The ' + niceName + ' you entered is already in use.'
  });
}

function invalidLocality(validationResults) {
  validationResults.count++;
  validationResults.errors.push({
    code: 'invalid_locality',
    message: 'The location you entered is invalid.'
  });
}

function validateUserCreate(newUser, cb) {
  var validationResults = getEmptyValidationResults();
  var query = User.find({});
  query.or([ { email: newUser.email }, { username: newUser.username } ]);
  query.only([ 'email', 'username' ]);
  query.run(function uniqueUserQuery(err, docs) {
    if (err) {
      cb(err);
    } else {
      docs.forEach(function checkDoc(doc) {
        if (doc.username === newUser.username) {
          alreadyInUse('username', 'username', validationResults);
        }
        if (doc.email === newUser.email) {
          alreadyInUse('email', 'email address', validationResults);
        }
      });
      cb(validationResults.count > 0 ? validationResults : null);
    }
  });
}

function validateRegoCreate(newRego, cb) {
  var validationResults = getEmptyValidationResults();
  var query = Rego.find({ rego: newRego.rego, state: newRego.state, country: newRego.country });
  query.run(function uniqueRegoQuery(err, docs) {
    if (err) {
      cb(err);
    } else if (docs.length > 0) {
      alreadyInUse('rego', 'vehicle registration', validationResults);
      cb(validationResults);
    } else {
      validateLocality({ stateCode: newRego.state, countryCode: newRego.country }, cb);
    }
  });
}

function validateLocality(locality, cb) {
  var validationResults = getEmptyValidationResults();
  var query = Locality.findOne({ countryCode: locality.countryCode, 'states.stateCode': locality.stateCode });
  query.run(function localityExistsQueryResponse(err, doc) {
    if (err) {
      cb(err);
    } else if (!doc) {
      invalidLocality(validationResults);
      cb(validationResults);
    } else {
      cb();
    }
  })
}

function validateRegoWatch(user, rego, cb) {
  var validationResults = getEmptyValidationResults();
  process.nextTick(function checkRego() {
    var found = _.find(rego.watchers, function filter(watcher) {
      return watcher.user.toString() === user._id.toString();
    });
    if (found) {
      alreadyWatching(validationResults);
      cb(validationResults);
    } else {
      cb();
    }
  });
}

function validateConversationOnRego(conversation, user, rego, cb) {
  cb();
}

function getEmptyValidationResults() {
  return { type: 'validation', count: 0, errors: [] };
}

exports.validateUserCreate = validateUserCreate;
exports.validateRegoCreate = validateRegoCreate;
exports.validateRegoWatch = validateRegoWatch;
exports.validateConversationOnRego = validateConversationOnRego;
