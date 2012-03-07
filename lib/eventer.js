var schema = require('./db/schema');
var Event = schema.Event;
var mongoose = require('mongoose');

function alertWatchers(type, user, rego, referring, event) {
  process.nextTick(function alertWatchersLater() {
  });
}

function spamEvent(type, user, rego, referring) {
  process.nextTick(function createEventLater() {
    var referringTo;
    if (referring) {
      referringTo = {};
      referringTo._id = referring._id,
      referringTo.subject = referring.subject,
      referringTo.content = referring.content
    }
    var event = new Event({
      rego: {
        _id: rego._id,
        rego: rego.rego,
        country: rego.country,
        state: rego.state
      },
      user: {
        _id: user._id,
        name: user.name,
        username: user.username
      },
      referringTo: referringTo,
      type: type
    });
    event.save(function saveEventResult(err) {
      if (err) {
        console.log(err);
      }
    });
    alertWatchers(type, user, rego, referring, event);
  });
}

exports.spamEvent = spamEvent;
