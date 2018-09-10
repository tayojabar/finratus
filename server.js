// Loads the environment variables from the .env file
require('dotenv').config();

var express = require('express');
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');

// fs.stat('viewer/', function(err) {
//   if (!err) {
//       console.log('file or directory exists');
//   }
//   else if (err.code === 'ENOENT') {
//       console.log('file or directory does not exist');
//   }
// });

var app = express();
var index = require('./routes/index');
var user = require('./routes/users');
var cors = require('cors');
//var login = require('./routes/users/login');

app.use(express.static(__dirname + '/views'));

//Database connection
// app.use(function(req, res, next){
// 	global.connection = mysql.createConnection({
//       host     : '140.86.3.185',
//       //port :'49436',
//       user     : 'appuser',
//       password : 'Pass@word1',
//       database : 'vehicle_inspection',
//       insecureAuth: true
// 	});
// 	connection.connect(function(err) {
//     if (err) {
//       return console.error('error connecting: ' + err.stack);
//     }
//     console.log('connected as id ' + connection.threadId);
//   });
// 	next();
// });

//File Upload
app.use(fileUpload());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// fix cors issues
app.use(cors());

app.use('/', index);
app.use('/user', user);

app.get('/', function(req, res){
  res.sendFile('index.html');
});

app.get('/vehicles', function(req, res){
  res.sendFile('all-vehicles.html', { root: __dirname+'/views' });
});

//app.use('/login', login);

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