var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var RegoModel = new Schema();
var WatcherModel = require('./watcher');
var ConversationModel = require('./conversation');

RegoModel.add({
  rego: {type: String, index: true },
  state: String,
  country: String,
  watchers: [ WatcherModel ],
  conversationCount: { type: Number, default: 0 },
  conversations: [ ConversationModel ],
  createdBy: { type: ObjectId, index: true },
  updatedDate: Date
});
RegoModel.index({ rego: 1, country: 1, state: 1 }, { unique: true })

RegoModel.pre('save', function preSave(next) {
  this.updatedDate = new Date();
  next();
});

module.exports = RegoModel;
