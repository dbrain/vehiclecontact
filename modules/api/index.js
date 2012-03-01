var express = require('express');
var config = require('../../conf/config');
var mongoose = require('mongoose');
var api = require('../../lib/api');
var app = module.exports = express.createServer();
var requestValidator = require('../../lib/requestValidator');
var oauthMiddleware = require('../../lib/oauthMiddleware');
var authorisationMiddleware = require('../../lib/authorisationMiddleware');
var responseCreator = require('../../lib/responseCreator');

app.mounted(function mounted(parent) {
  app.registerErrorHandlers();
  console.log('Mounted API.');
});

function handleError(err, req, res) {
  res.send({ error: 'server_error', gibberish: { message: err.message, stack: err.stack } }, 500);
}

app.configure(function () {
  app.error(handleError);
  app.use(express.bodyParser());
  app.use(requestValidator.requestParser());
  app.use(oauthMiddleware.requestParser());
  app.use(authorisationMiddleware.requestParser());
  mongoose.connect(config.mongo.uri);
});

app.put('/user', function createUser(req, res, next) {
  api.createUser(req.body, function createUserResponse(err, user) {
    if (err) {
      res.send(err)
    } else {
      res.send(responseCreator.createUserResponse(user));
    }
  });
});

app.put('/rego', function createRego(req, res, next) {
  api.createRego(req.user, req.body, function createRegoResponse(err, rego) {
    if (err) {
      res.send(err);
    } else {
      res.send(responseCreator.createRegoResponse(rego));
    }
  })
});

app.put('/rego/:country/:state/:rego/watchers', function watchRego(req, res, next) {
  function watchRegoResponse(err, response) {
    if (err) {
      res.send(err);
    } else {
      res.send(responseCreator.createWatcherResponse(response.rego, response.watcher));
    }
  }
  api.watchRego(req.body, req.user, req.param('rego'), req.param('state'), req.param('country'), watchRegoResponse);
});

app.put('/rego/:country/:state/:rego/conversations', function createConversationOnRego(req, res, next) {
  function commentOnRegoResponse(err, response) {
    if (err) {
      res.send(err);
    } else {
      res.send(responseCreator.commentOnRegoResponse(response.rego, response.conversation));
    }
  }
  api.createConversationOnRego(req.body, req.user, req.param('rego'), req.param('state'), req.param('country'), commentOnRegoResponse);
});

app.get('/health', function (req, res, next) {
  res.send({ status: 'ok'});
});
