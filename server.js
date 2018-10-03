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

//check and create uploads directory
if (!fs.existsSync('./files')){
    fs.mkdirSync('./files');
    console.log('Files folder created');
} else {
    console.log('Files folder exists');
}

if (fs.existsSync('./files')){
    if (!fs.existsSync('./files/users')){
        fs.mkdirSync('./files/users');
        console.log('Users folder created');
    } else {
        console.log('Users folder exists');
    }
}

var app = express();
var index = require('./routes/index');
var user = require('./routes/users');
var cors = require('cors');

app.use(express.static(__dirname + '/views'));

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
app.use('/files', express.static(__dirname + '/files'));

app.get('/login', function(req, res){
    res.sendFile('login.html', { root: __dirname+'/views' });
});

app.get('/admin', function(req, res){
  res.sendFile('login.html', { root: __dirname+'/views' });
});

app.get('/dashboard', function(req, res){
    res.sendFile('index.html', { root: __dirname+'/views' });
});

app.get('/all-vehicles', function(req, res){
  res.sendFile('all-vehicles.html', { root: __dirname+'/views' });
});

app.get('/all-users', function(req, res){
    res.sendFile('all-users.html', { root: __dirname+'/views' });
  });

app.get('/all-users', function(req, res){
    res.sendFile('all-users.html', { root: __dirname+'/views' });
});

app.get('/all-applications', function(req, res){
  res.sendFile('all-applications.html', { root: __dirname+'/views' });
});

app.get('/all-owners', function(req, res){
    res.sendFile('all-owners.html', { root: __dirname+'/views' });
  });

app.get('/add-vehicle', function(req, res){
    res.sendFile('add-vehicles.html', { root: __dirname+'/views' });
});

app.get('/add-user', function(req, res){
    res.sendFile('add-user.html', { root: __dirname+'/views' });
});

app.get('/add-owner', function(req, res){
    res.sendFile('add-owner.html', { root: __dirname+'/views' });
});

app.get('/add-model', function(req, res){
    res.sendFile('add-model.html', { root: __dirname+'/views' });
});

app.get('/inspections', function(req, res){
    res.sendFile('inspections.html', { root: __dirname+'/views' });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

module.exports = app;
var server = http.createServer(app);

server.listen(process.env.port || process.env.PORT || 4000, function () {
    console.log('server running on %s [%s]', process.env.PORT, process.env.STATUS);
});