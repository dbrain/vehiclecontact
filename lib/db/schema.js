var mongoose = require('mongoose');

exports.User = mongoose.model('User', require('./model/user'));
exports.Rego = mongoose.model('Rego', require('./model/rego'));
exports.Conversation = mongoose.model('Conversation', require('./model/conversation'));
exports.Watcher = mongoose.model('Watcher', require('./model/watcher'));
