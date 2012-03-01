var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var ConversationModel = new Schema();

ConversationModel.add({
  parent: ObjectId,
  user: ObjectId,
  subject: String,
  content: String,
  replies: [ ConversationModel ],
  deleted: Boolean,
  editedDate: Date
});

// TODO pre 'update' ?
ConversationModel.pre('save', function preSave(next) {
  next();
});

module.exports = ConversationModel;
