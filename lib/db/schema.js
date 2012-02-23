var mongoose = require('mongoose');

exports.User = mongoose.model('User', require('./model/user'));
exports.Rego = mongoose.model('Rego', require('./model/rego'));
