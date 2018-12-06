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
var session = require('client-sessions');
var morgan = require('morgan');
var db = require('./db');
var cookie = require('cookie');
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
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

// fix cors issues
app.use(cors());

//Session 
app.use(session({
    cookieName: 'session',
    secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));

app.post('/login', function(req, res) {
    var appData = {}; var user = [];
    var username = req.body.username;
    var password = req.body.password;
    db.query('SELECT *, (select role_name from user_roles r where r.id = user_role) as role FROM users WHERE username = ? and status = 1', username, function(err, rows, fields) {
      if (err) {
        //res.sendFile('/login', { error: 'Invalid email or password.' });
        //res.redirect('/inspections');
        // res.sendFile('index.html', { root: __dirname+'/views' });
          res.send({"status": 500, "response": "Connection Error!"});
      }
      else if (rows.length === 0){
          res.send({"status": 500, "response": "User Disabled!"});
      }
      else if (password === rows[0].password) {
          // sets a cookie with the user's info

          user = rows[0];
          db.query('SELECT id,module_id, (select module_name from modules m where m.id = module_id) as module_name, read_only, editable FROM permissions where role_id = ? and date in (select max(date) from permissions where role_id = ?) group by module_id', [user.user_role, user.user_role], function (error, perm, fields) {
              if (!error) {
                  user.permissions = perm
                  var query = 'select * from modules m where m.id in (select p.module_id from permissions p where read_only = 1 ' +
                                'and p.role_id = ? and date in (select max(date) from permissions where role_id = ?) group by module_id) order by menu_name asc'
                  db.query(query, [user.user_role, user.user_role], function (er, mods, fields) {
                    user.modules = mods;
                    // res.setHeader('Set-Cookie', cookie.serialize('user', rows[0], {
                    //       httpOnly: true,
                    //       maxAge: 60 * 60 * 24 * 7 // 1 week
                    //   }));
                    res.send({"status": 200, "response": user});
                  });
              }
              else {
                  res.send({"status": 500, "response": "No permissions set for this user"})
              }
          });
          //res.sendFile('dashboard.html', { root: __dirname+'/views' });
      }
      else {
          //   res.sendFile('/login', { error: 'Invalid email or password.' });
          //res.redirect('/login');
          // res.sendFile('index.html', {root: __dirname + '/views'});
          res.send({"status": 500, "response": "Login Unsuccessful!"});
      }
    });
  });


app.use(function(req, res, next) {
    if (req.session && req.session.user) {
        db.query('SELECT * FROM users WHERE email = ?', req.session.user.email, function(err, rows, fields) {
            if (!err) {
                req.user = rows[0];
                delete rows[0].password; // delete the password from the session
                req.session.user = rows[0];  //refresh the session value
                res.locals.user = rows[0];
            }
            // finishing processing the middleware and run the route
            next();
            });
    } else {
        next();
    }
});

function requireLogin (req, res, next) {
    if (!req.headers.cookie) {
      res.sendFile('index.html', { root: __dirname+'/views' });
    } else {
      next();
    }
}

app.get('/logout', function(req, res) {
    req.session.reset();
    res.redirect('/logon');
    //res.sendFile('dashboard.html', { root: __dirname+'/views' });
  });

app.use('/', index);
app.use('/user', user);
app.use('/files', express.static(__dirname + '/files'));

// app.get('/login', function(req, res){
//     res.sendFile('login.html', { root: __dirname+'/views' });
// });

app.get('/logon', function(req, res){
  res.sendFile('index.html', { root: __dirname+'/views' });
});

app.get('/dashboard', requireLogin, function(req, res){
    res.sendFile('dashboard.html', { root: __dirname+'/views' });
});

app.get('/all-vehicles', requireLogin, function(req, res){
  res.sendFile('all-vehicles.html', { root: __dirname+'/views' });
});

app.get('/all-users', requireLogin, function(req, res){
    res.sendFile('all-users.html', { root: __dirname+'/views' });
  });

app.get('/all-users', requireLogin, function(req, res){
    res.sendFile('all-users.html', { root: __dirname+'/views' });
});

app.get('/all-applications', requireLogin, function(req, res){
  res.sendFile('all-applications.html', { root: __dirname+'/views' });
});

app.get('/all-owners', requireLogin, function(req, res){
    res.sendFile('all-owners.html', { root: __dirname+'/views' });
  });

app.get('/add-vehicle', requireLogin, function(req, res){
    res.sendFile('add-vehicles.html', { root: __dirname+'/views' });
});

app.get('/add-user', requireLogin, function(req, res){
    res.sendFile('add-user.html', { root: __dirname+'/views' });
});

app.get('/add-owner', requireLogin, function(req, res){
    res.sendFile('add-owner.html', { root: __dirname+'/views' });
});

app.get('/add-model', requireLogin, function(req, res){
    res.sendFile('add-model.html', { root: __dirname+'/views' });
});

app.get('/all-models', requireLogin, function(req, res){
    res.sendFile('all-models.html', { root: __dirname+'/views' });
});

app.get('/inspections', requireLogin, function(req, res){
    res.sendFile('inspections.html', { root: __dirname+'/views' });
});

app.get('/branches', requireLogin, function(req, res){
    res.sendFile('branches.html', { root: __dirname+'/views' });
});

app.get('/reports', requireLogin, function(req, res){
    res.sendFile('reports.html', { root: __dirname+'/views' });
});

app.get('/workflow', requireLogin, function(req, res){
    res.sendFile('workflow.html', { root: __dirname+'/views' });
});

app.get('/application/:id?', requireLogin, function(req, res) {
    res.sendFile('application.html', {root: __dirname + '/views'});
});

app.get('/manage-permissions', requireLogin, function(req, res){
    res.sendFile('manage-permissions.html', { root: __dirname+'/views' });
});

app.get('/module', requireLogin, function(req, res){
    res.sendFile('modules.html', { root: __dirname+'/views' });
});

app.get('/add-application', requireLogin, function(req, res){
    res.sendFile('add-application.html', { root: __dirname+'/views' });
});

app.get('/all-workflow', requireLogin, function(req, res){
    res.sendFile('all-workflow.html', { root: __dirname+'/views' });
});

app.get('/all-requests', requireLogin, function(req, res){
    res.sendFile('all-requests.html', { root: __dirname+'/views' });
});

app.get('/loan-repayment', requireLogin, function(req, res){
    res.sendFile('loan-repayment.html', { root: __dirname+'/views' });
});

app.get('/add-client', requireLogin, function(req, res){
    res.sendFile('add-client.html', { root: __dirname+'/views' });
});

app.get('/all-clients', requireLogin, function(req, res){
    res.sendFile('all-clients.html', { root: __dirname+'/views' });
});

app.get('/client-info', requireLogin, function(req, res){
    res.sendFile('client-info.html', { root: __dirname+'/views' });
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