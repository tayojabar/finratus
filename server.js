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
      host     : 'localhost',
      port :'3306',
      user     : 'loan35',
      password : 'Password35',
      database : 'vehicle_inspection',
      insecureAuth: true
	});
	connection.connect();
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
server.listen(4000);
