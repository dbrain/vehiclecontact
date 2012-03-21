var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var WatcherModel = new Schema();

WatcherModel.add({
  user: ObjectId,
  email: { type: Boolean, default: true }
});

module.exports = WatcherModel;
