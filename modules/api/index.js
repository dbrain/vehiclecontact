var express = require('express');
var config = require('../../conf/config');
var mongoose = require('mongoose');
var api = require('../../lib/api');
var app = module.exports = express.createServer();
var requestValidator = require('../../lib/requestValidator');
var oauthMiddleware = require('../../lib/oauthMiddleware');
var authorisationMiddleware = require('../../lib/authorisationMiddleware');
var responseCreator = require('../../lib/responseCreator');
var eventer = require('../../lib/eventer');

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

app.get('/', function newsStream(req, res, next) {
  function getNewsStreamResponse(err, eventResponse) {
    if (err) {
      res.send(err, 500);
    } else {
      res.send(responseCreator.newsStreamResponse(eventResponse));
    }
  };
  var query = req.query;
  if (req.user && query.all !== 'true') {
    api.userNewsStream(req.user, query, getNewsStreamResponse);
  } else {
    api.publicNewsStream(query, getNewsStreamResponse);
  }
});

app.get('/user/watching', function getWatching(req, res, next) {
  var query = req.query;
  if (query.detailed) {
    api.userWatching(req.user, query, function getWatchingResponse(err, watching) {
      if (err) {
        res.send(err, 500);
      } else {
        res.send(responseCreator.getWatchingResponse(watching));
      }
    });
  } else {
    process.nextTick(function returnIds() {
      res.send(responseCreator.getUndetailedWatchingResponse(req.user.watching));
    })
  }
});

app.get('/regos', function findRego(req, res, next) {
  var query = req.query;
  api.findRegos(query, function findRegoResponse(err, regos) {
    if (err) {
      res.send(err, 500);
    } else {
      res.send(responseCreator.getFindRegoResponse(req.user, regos));
    }
  });
});

app.put('/user', function createUser(req, res, next) {
  api.createUser(req.body, function createUserResponse(err, user) {
    if (err) {
      res.send(err, 500);
    } else {
      res.send(responseCreator.createUserResponse(user));
    }
  });
});

app.put('/rego', function createRego(req, res, next) {
  api.createRego(req.user, req.body, function createRegoResponse(err, rego) {
    if (err) {
      res.send(err, 500);
    } else {
      res.send(responseCreator.createRegoResponse(rego));
    }
  })
});

app.get('/rego/:country/:state/:rego', function watchRego(req, res, next) {
  var query = req.query;
  api.getRego(query, req.param('rego'), req.param('state'), req.param('country'), function regoResponse(err, response) {
    if (err) {
      res.send(err, 500);
    } else if (response.result) {
      res.send(responseCreator.getRegoDetailedResponse(req.user, response));
    } else {
      res.send('Rego not found', 404);
    }
  });
});

app.put('/rego/:country/:state/:rego/watchers', function watchRego(req, res, next) {
  function watchRegoResponse(err, response) {
    if (err) {
      res.send(err, 500);
    } else {
      eventer.spamEvent('watch', req.user, response.rego, response.watcher);
      res.send(responseCreator.createWatcherResponse(response.rego, response.watcher));
    }
  }
  api.watchRego(req.body, req.user, req.param('rego'), req.param('state'), req.param('country'), watchRegoResponse);
});

app.put('/rego/:country/:state/:rego/conversations', function createConversationOnRego(req, res, next) {
  function commentOnRegoResponse(err, response) {
    if (err) {
      res.send(err, 500);
    } else {
      eventer.spamEvent('conversation', req.user, response.rego, response.conversation);
      res.send(responseCreator.commentOnRegoResponse(response.rego, response.conversation));
    }
  }
  api.createConversationOnRego(req.body, req.user, req.param('rego'), req.param('state'), req.param('country'), commentOnRegoResponse);
});

app.get('/health', function (req, res, next) {
  res.send({ status: 'ok'});
});
