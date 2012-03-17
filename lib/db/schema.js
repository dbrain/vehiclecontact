var mongoose = require('mongoose');

exports.User = mongoose.model('User', require('./model/user'));
exports.Rego = mongoose.model('Rego', require('./model/rego'));
exports.Conversation = mongoose.model('Conversation', require('./model/conversation'));
exports.Watcher = mongoose.model('Watcher', require('./model/watcher'));
exports.Token = mongoose.model('Token', require('./model/token'));
exports.Event = mongoose.model('Event', require('./model/event'));
exports.Locality = mongoose.model('Locality', require('./model/locality'));
