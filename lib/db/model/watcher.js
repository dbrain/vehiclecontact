var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var WatcherModel = new Schema();

WatcherModel.add({
  user: ObjectId,
  email: Boolean
});

// TODO pre 'update' ?
WatcherModel.pre('save', function preSave(next) {
  next();
});

module.exports = WatcherModel;
