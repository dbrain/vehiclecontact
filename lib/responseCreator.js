var _  = require('underscore');

function createUserResponse(user) {
  return { status: 'ok', user: userResponse(user) };
}

function createRegoResponse(rego) {
  return { status: 'ok', rego: regoResponse(rego) };
}

function createWatcherResponse(rego, watcher) {
  var cleanResponse = {
    status: 'ok',
    rego: regoResponse(rego),
    watcher: watcherResponse(watcher)
  };
  return cleanResponse;
}

function newsStreamResponse(result) {
  var cleanResponse = {
    status: 'ok',
    events: result.results,
    pagination: result.pagination
  };
  return cleanResponse;
}

function commentOnRegoResponse(rego, conversation) {
  var cleanResponse = {
    status: 'ok',
    rego: regoResponse(rego),
    conversation: conversationResponse(conversation)
  };
  return cleanResponse;
}

function getWatchingResponse(result) {
  var cleanResponse = {
    status: 'ok',
    watching: _.map(result.results, regoResponse),
    pagination: result.pagination
  }
  return cleanResponse;
}

function getUndetailedWatchingResponse(watchingIdArray) {
  var cleanResponse = {
    status: 'ok',
    watching: _.map(watchingIdArray, function convertToObject(watchingId) {
      return { _id: watchingId };
    })
  };
  return cleanResponse;
}

function getFindRegoResponse(user, result) {
  var regos = _.map(result.results, function cleanRego(rego) {
    rego = regoResponse(rego);
    if (user && user.watching && user.watching.indexOf(rego._id) !== -1) {
      rego.watching = true;
    }
    return rego;
  });
  var cleanResponse = {
    status: 'ok',
    regos: regos,
    pagination: result.pagination
  };
  return cleanResponse;
}

function getRegoDetailedResponse(user, rego) {
  var cleanRego = {
    _id: rego._id,
    rego: rego.rego,
    state: rego.state,
    country: rego.country,
    conversations: rego.conversations
  };
  if (user && user.watching && user.watching.indexOf(cleanRego._id) !== -1) {
      cleanRego.watching = true;
  }
  var cleanResponse = {
    status: 'ok',
    rego: cleanRego
  };
  return cleanResponse;
};

function regoResponse(rego) {
  var cleanRego = {
    _id: rego._id,
    rego: rego.rego,
    state: rego.state,
    country: rego.country
  };
  return cleanRego;
}

function userResponse(user) {
  var cleanUser = {
    _id: user._id,
    email: user.email,
    username: user.username,
    name: user.name,
  };
  return cleanUser;
}

function watcherResponse(watcher) {
  var cleanWatcher = {
    _id: watcher._id,
    user: watcher.user,
    email: watcher.email
  };
  return cleanWatcher;
}

function conversationResponse(conversation) {
  var cleanConversation = {
    _id: conversation._id,
    parent: conversation.parent,
    user: conversation.user,
    subject: conversation.subject,
    content: conversation.content,
    replies: _.map(conversation.replies, function cleanReplies(reply) {
      return conversationResponse(reply);
    }),
    deleted: !!conversation.deleted,
    editedDate: conversation.editedDate
  };
  return cleanConversation;
}


exports.createUserResponse = createUserResponse;
exports.createRegoResponse = createRegoResponse;
exports.createWatcherResponse = createWatcherResponse;
exports.commentOnRegoResponse = commentOnRegoResponse;
exports.newsStreamResponse = newsStreamResponse;
exports.getWatchingResponse = getWatchingResponse;
exports.getUndetailedWatchingResponse = getUndetailedWatchingResponse;
exports.getFindRegoResponse = getFindRegoResponse;
exports.getRegoDetailedResponse = getRegoDetailedResponse;
