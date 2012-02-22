var _ = require('underscore');

var defaultConfig = require('./envs/default');
var config = require('./envs/' + (process.env.NODE_ENV || 'local'));

module.exports = _.extend(defaultConfig, config);
