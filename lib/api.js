var mongoose = require('mongoose');
var paginator = require('./paginator');
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
var textUtils = require('./textUtils');

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
        rego: textUtils.normaliseRego(newRego.rego),
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
  if (!queryParams.detailed) {
    query.exclude('referringTo');
  }
  if (regos) {
    query.where('rego._id').in(regos);
  }
  Event.paginate(query, queryParams.page, queryParams.count, cb);
}

function publicNewsStream(queryParams, cb) {
  queryNewsStream(queryParams, null, cb);
}

function userNewsStream(user, queryParams, cb) {
  queryNewsStream(queryParams, user.watching, cb);
}

function userWatching(user, queryParams, cb) {
  if (user.watching && user.watching.length > 0) {
    var query = Rego.find({});
    query.where('_id').in(user.watching);
    Rego.paginate(query, queryParams.page, queryParams.count, cb);
  } else {
    process.nextTick(function emptyResult() {
      cb(null, []);
    });
  }
}

function findRegos(queryParams, cb) {
  var query = Rego.find({});
  if (queryParams.rego) {
    query.where('rego', textUtils.normaliseRego(queryParams.rego));
  }
  if (queryParams.state) {
    query.where('state', queryParams.state);
  }
  if (queryParams.country) {
    query.where('country', queryParams.country);
  }
  Rego.paginate(query, queryParams.page, queryParams.count, cb);
}

function getRego(queryParams, regoNo, state, country, cb) {
  var query = Rego.findOne({ rego: regoNo, state: state, country: country });
  var slice = [
    (queryParams.count * (queryParams.page - 1)),
    queryParams.count
  ];
  query.where('conversations').slice(slice);
  query.run(cb);
}

exports.createUser = createUser;
exports.createRego = createRego;
exports.watchRego = watchRego;
exports.oauth = oauth;
exports.lookupAccessToken = lookupAccessToken;
exports.createConversationOnRego = createConversationOnRego;
exports.publicNewsStream = publicNewsStream;
exports.userNewsStream = userNewsStream;
exports.userWatching = userWatching;
exports.findRegos = findRegos;
exports.getRego = getRego;
