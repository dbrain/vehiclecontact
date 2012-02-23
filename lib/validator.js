var schema = require('./db/schema');
var User = schema.User;
var Rego = schema.Rego;

function alreadyInUse(field, niceName, validationResults) {
  validationResults.count++;
  validationResults.errors.push({
    field: field,
    code: 'already_in_use',
    message: 'The ' + niceName + ' you entered is already in use.'
  });
}

function validateUserCreate(newUser, cb) {
  var validationResults = { type: 'validation', count: 0, errors: [] };
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
  var validationResults = { type: 'validation', count: 0, errors: [] };
  var query = Rego.find({ rego: newRego.rego, state: newRego.state, country: newRego.country });
  query.run(function uniqueRegoQuery(err, docs) {
    if (err) {
      cb(err);
    } else if (docs.length > 0) {
      alreadyInUse('rego', 'vehicle registration', validationResults);
      cb(validationResults);
    } else {
      cb();
    }
  });
}

exports.validateUserCreate = validateUserCreate;
exports.validateRegoCreate = validateRegoCreate;
