var mongoose = require('mongoose');
var schema = require('./db/schema');
var User = schema.User;
var Rego = schema.Rego;
var Watcher = schema.Watcher;
var Conversation = schema.Conversation;
var Event = schema.Event;
var passwordUtils = require('./passwordUtils');
var async = require('async');
var series = async.series;
var parallel = async.parallel;
var validator = require('./validator');
var authentication = require('./authentication');
var config = require('../conf/config');
var oauthHelper = require('oauth2-helper').helper(authentication, config.oauth);
var _ = require('underscore');

function oauth(request, cb) {
  oauthHelper.request(request, cb);
}

function lookupAccessToken(accessToken, cb) {
  oauthHelper.lookupAccessToken(accessToken, cb);
}

function createUser(newUser, cb) {
  var steps = {
    validate: function validate(validateCb) {
      validator.validateUserCreate(newUser, validateCb)
    },
    passwordHash: function hashPassword(passwordCb) {
      passwordUtils.hashPassword(newUser.password, passwordCb);
    }
  };

  function makeTheMagicHappen(err, results) {
    if (err) {
      cb(err);
    } else {
      var user = new User({
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        password: results.passwordHash
      });
      user.save(function saveUserResult(err) {
        cb(err, user);
      });
    }
  }

  series(steps, makeTheMagicHappen);
}

function createRego(user, newRego, cb) {
  var steps = {
    validate: function validate(validateCb) {
      validator.validateRegoCreate(newRego, validateCb)
    }
  };

  function makeTheMagicHappen(err, results) {
    if (err) {
      cb(err);
    } else {
      var rego = new Rego({
        rego: newRego.rego,
        state: newRego.state,
        country: newRego.country,
        createdBy: user._id
      });
      rego.save(function saveRegoResult(err) {
        cb(err, rego);
      });
    }
  }

  series(steps, makeTheMagicHappen);
}

function watchRego(body, user, regoNo, state, country, cb) {
  var query = Rego.findOne({ rego: regoNo, state: state, country: country });
  query.run(function regoResult(err, rego) {
    if (err) {
      cb(err);
    } else if (!rego) {
      cb('Rego not found.');
    } else {
      var steps = {
        validate: function validate(validateCb) {
          validator.validateRegoWatch(user, rego, validateCb);
        }
      };

      function makeTheMagicHappen(err, results) {
        if (err) {
          cb(err);
        } else {
          var watcher = new Watcher({ user: user._id, email: !!body.email })
          rego.watchers.push(watcher);
          user.watching.push(rego._id);
          user.save(function saveUserResult(err) {
            if (err) {
              cb(err);
            } else {
              rego.save(function saveRegoResult(err) {
                cb(err, { rego: rego, watcher: watcher });
              });
            }
          });
        }
      };

      series(steps, makeTheMagicHappen);
    }
  });
}

function createConversationOnRego(body, user, regoNo, state, country, cb) {
  var query = Rego.findOne({ rego: regoNo, state: state, country: country });
  query.run(function regoResult(err, rego) {
    if (err) {
      cb(err);
    } else if (!rego) {
      cb('Rego not found.');
    } else {
      var steps = {
        validate: function validate(validateCb) {
          validator.validateConversationOnRego(body, user, rego, validateCb);
        }
      };

      function makeTheMagicHappen(err, results) {
        if (err) {
          cb(err);
        } else {
          var conversation = new Conversation({
            user: user._id,
            subject: body.subject,
            content: body.content,
            parentConversation: body.parentConversation
          });
          var parentConversation = findParentConversation(rego, body.parentConversation);
          if (parentConversation) {
            parentConversation.replies.push(conversation);
          } else {
            rego.conversations.push(conversation);
          }
          rego.save(function saveRegoResult(err) {
            cb(err, { rego: rego, conversation: conversation });
          });
        }
      }

      series(steps, makeTheMagicHappen);
    }
  });
}

function findParentConversation(rego, parentConversation) {
  var container =  { conversation: rego.conversations.id(parentConversation) };
  if (!container.conversation) {
    _.all(rego.conversations, checkConversationForParent(parentConversation, container));
  }
  return container.conversation;
}

function checkConversationForParent(parentConversation, container) {
  return function checkConversation(currentConversation) {
    if (currentConversation._id.toString() === parentConversation) {
      container.conversation = currentConversation;
    } else {
      _.all(currentConversation.replies, checkConversationForParent(parentConversation, container));
    }
    return !!container.conversation;
  };
}

function queryNewsStream(queryParams, regos, cb) {
  var query = Event.find({});
  query.skip(queryParams.count * (queryParams.page - 1));
  query.limit(queryParams.count);
  if (!queryParams.detailed) {
    query.exclude('referringTo');
  }
  if (regos) {
    query.where('rego._id').in(regos);
  }
  query.run(cb);
}

function publicNewsStream(queryParams, cb) {
  queryNewsStream(queryParams, null, function newsStreamResult(err, events) {
    cb(err, { events: events });
  });
}

function userNewsStream(user, queryParams, cb) {
  queryNewsStream(queryParams, user.watching, function newsStreamResult(err, events) {
    cb(err, { events: events });
  });
}

exports.createUser = createUser;
exports.createRego = createRego;
exports.watchRego = watchRego;
exports.oauth = oauth;
exports.lookupAccessToken = lookupAccessToken;
exports.createConversationOnRego = createConversationOnRego;
exports.publicNewsStream = publicNewsStream;
exports.userNewsStream = userNewsStream;
