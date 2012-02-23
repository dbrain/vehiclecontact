var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var ConversationModel = new Schema();
var RegoModel = new Schema();

ConversationModel.add({
  user: ObjectId,
  subject: String,
  content: String,
  replies: [ ConversationModel ],
  deleted: Boolean,
  editedDate: Date
});

RegoModel.add({
  rego: String,
  state: String,
  country: String,
  watchers: [ ObjectId ],
  conversations: [ ConversationModel ],
  createdBy: ObjectId,
  updatedDate: Date
});

RegoModel.pre('save', function preSave(next) {
  this.updatedDate = new Date();
  next();
});

module.exports = RegoModel;
