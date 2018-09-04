// Loads the environment variables from the .env file
require('dotenv').config();

var express = require('express');
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

var app = express();
var index = require('./routes/index');

//Database connection
app.use(function(req, res, next){
	global.connection = mysql.createConnection({
      host     : '140.86.3.244',
      //port :'49436',
      user     : 'appuser',
      password : 'Pass@word1',
      database : 'vehicle_inspection',
      insecureAuth: true
	});
	connection.connect(function(err) {
	    console.log('mysql connection works')
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('connected as id ' + connection.threadId);
  });
	next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

module.exports = app;
var server = http.createServer(app);

server.listen(process.env.port || process.env.PORT || 4000, function () {
    console.log('%s listening to %s', server.name, server.url);
});