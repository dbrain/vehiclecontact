var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var RegoModel = new Schema();
var WatcherModel = require('./watcher');
var ConversationModel = require('./conversation');

RegoModel.add({
  rego: String,
  state: String,
  country: String,
  watchers: [ WatcherModel ],
  conversationCount: { type: Number, default: 0 },
  conversations: [ ConversationModel ],
  createdBy: ObjectId,
  updatedDate: Date
});

RegoModel.pre('save', function preSave(next) {
  this.updatedDate = new Date();
  next();
});

module.exports = RegoModel;
