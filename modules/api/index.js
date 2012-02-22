var express = require('express');
var config = require('../../conf/config');
var mongoose = require('mongoose');
var api = require('../../lib/api');
var app = module.exports = express.createServer();
var requestValidator = require('../../lib/requestValidator');
var oauthMiddleware = require('../../lib/oauthMiddleware');
var authorisationMiddleware = require('../../lib/authorisationMiddleware');

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

app.post('/createUser', function createUser(req, res, next) {
  api.createUser(req.body, function createUserResponse(err, user) {
    if (err) {
      next(err)
    } else {
      res.send({ status: 'ok', user: user });
    }
  });
});

app.get('/me', function getMe(req, res, next) {
  res.send(req.user);
});

app.get('/health', function (req, res, next) {
  res.send({ status: 'ok'});
});
