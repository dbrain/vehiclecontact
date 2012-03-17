var express = require('express');
var app = module.exports = express.createServer();
var api = require('./api');
var localityImporter = require('../lib/localityImporter');

function handleError(err, req, res) {
  res.send({ error: 'server_error', gibberish: { message: err.message, stack: err.stack } }, 500);
}

app.configure(function () {
  app.error(handleError);
  localityImporter.importIfMissing();
  app.use('/api', api);
});
