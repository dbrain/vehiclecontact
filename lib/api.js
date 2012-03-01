var mongoose = require('mongoose');
var schema = require('./db/schema');
var User = schema.User;
var Rego = schema.Rego;
var Watcher = schema.Watcher;
var Conversation = schema.Conversation;
var passwordUtils = require('./passwordUtils');
var series = require('async').series;
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
          rego.save(function saveRegoResult(err) {
            cb(err, { rego: rego, watcher: watcher });
          });
        }
      }

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

exports.createUser = createUser;
exports.createRego = createRego;
exports.watchRego = watchRego;
exports.oauth = oauth;
exports.lookupAccessToken = lookupAccessToken;
exports.createConversationOnRego = createConversationOnRego;
