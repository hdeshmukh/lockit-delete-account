
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var utils = require('lockit-utils');

// require delete account middleware
var DeleteAccount = require('../../index.js');

function start(config) {

  config = config || require('./config.js');

  var app = express();

  // set basedir so views can properly extend layout.jade
  app.locals.basedir = __dirname + '/views';

  // all environments
  app.set('port', process.env.PORT || config.port || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  // make JSON output simpler for testing
  app.set('json spaces', 0);
  app.use(express.favicon());
  app.use(express.urlencoded());
  app.use(express.json());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.cookieSession());

  if (config.csrf) {
    app.use(express.csrf());
    app.use(function(req, res, next) {

      var token = req.csrfToken();
      res.locals._csrf = token;

      // save token to a cookie so we can easily access it on the client
      res.cookie('csrf', token);
      next();
    });
  }

  // set a dummy session for testing purpose
  app.use(function(req, res, next) {
    req.session.name = 'john';
    req.session.email = 'john@email.com';
    next();
  });

  // use delete account middleware with testing options
  var db = utils.getDatabase(config);
  var adapter = require(db.adapter)(config);
  var deleteAccount = new DeleteAccount(app, config, adapter);

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  app.get('/', routes.index);
  app.get('/users', user.list);

  http.createServer(app).listen(app.get('port'));

  return app;

}

// export app for testing
if(require.main === module){
  // called directly
  start();
} else {
  // required as a module -> from test file
  module.exports = function(config) {
    return start(config);
  };
}
