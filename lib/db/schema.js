var mongoose = require('mongoose');

exports.User = mongoose.model('User', require('./model/user'));
