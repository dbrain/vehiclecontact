var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var ConversationModel = new Schema();

ConversationModel.add({
  parentConversation: ObjectId,
  user: { type: ObjectId, index: true },
  subject: String,
  content: String,
  replies: [ ConversationModel ],
  deleted: { type: Boolean, default: false, index: true },
  editedDate: Date
});

module.exports = ConversationModel;
