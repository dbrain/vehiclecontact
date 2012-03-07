var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
var EventModel = new Schema();

EventModel.add({
  rego: {
    _id: ObjectId,
    rego: String,
    country: String,
    state: String
  },
  user: {
    _id: ObjectId,
    name: String,
    username: String
  },
  referringTo: {
    _id: ObjectId,
    subject: String,
    content: String
  },
  type: { type: String, enum: [ 'conversation', 'watch' ] }
});

module.exports = EventModel;
