// Loads the environment variables from the .env file
require('dotenv').config();

let express = require('express');
let fs = require('fs'),
    db = require('./db'),
    http = require('http'),
    path = require('path'),
    mysql = require('mysql'),
    morgan = require('morgan'),
    bcrypt = require('bcryptjs'),
    cookie = require('cookie'),
    bodyParser = require('body-parser'),
    session = require('client-sessions'),
    cookieParser = require('cookie-parser'),
    fileUpload = require('express-fileupload');

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

let app = express(),
    cors = require('cors'),
    user = require('./routes/users'),
    index = require('./routes/index');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.json());
app.use(fileUpload());
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
    let user = [],
        username = req.body.username,
        password = req.body.password;

    db.query('SELECT *, (select role_name from user_roles r where r.id = user_role) as role FROM users WHERE username = ?', username, function(err, rows, fields) {
        if (err)
            return res.send({"status": 500, "response": "Connection Error!"});

        if (rows.length === 0)
            return res.send({"status": 500, "response": "Incorrect Username/Password!"});

        if (rows[0].status === "0")
            return res.send({"status": 500, "response": "User Disabled!"});

        if (bcrypt.compareSync(password,rows[0].password)) {
          user = rows[0];
          db.query('SELECT id,module_id, (select module_name from modules m where m.id = module_id) as module_name, read_only, editable FROM permissions where role_id = ? and date in (select max(date) from permissions where role_id = ?) group by module_id', [user.user_role, user.user_role], function (error, perm, fields) {
              if (!error) {
                  user.permissions = perm;
                  let modules = [],
                      query1 = 'select * from modules m where m.id in (select p.module_id from permissions p where read_only = 1 ' +
                                'and p.role_id = ? and date in (select max(date) from permissions where role_id = ?) group by module_id) and menu_name = "Main Menu" order by id asc',
                      query2 = 'select * from modules m where m.id in (select p.module_id from permissions p where read_only = 1 ' +
                          'and p.role_id = ? and date in (select max(date) from permissions where role_id = ?) group by module_id) and menu_name = "Sub Menu" order by id asc',
                      query3 = 'select * from modules m where m.id in (select p.module_id from permissions p where read_only = 1 ' +
                          'and p.role_id = ? and date in (select max(date) from permissions where role_id = ?) group by module_id) and menu_name = "Others" order by id asc';
                  db.query(query1, [user.user_role, user.user_role], function (er, mods, fields) {
                      modules = modules.concat(mods);
                      db.query(query2, [user.user_role, user.user_role], function (er, mods, fields) {
                          modules = modules.concat(mods);
                          db.query(query3, [user.user_role, user.user_role], function (er, mods, fields) {
                              modules = modules.concat(mods);
                              user.modules = modules;
                              res.send({"status": 200, "response": user});
                          });
                      });
                  });
              } else {
                  res.send({"status": 500, "response": "No permissions set for this user"})
              }
          });
      } else {
          res.send({"status": 500, "response": "Password is incorrect!"});
      }
    });
});


app.use(function(req, res, next) {
    if (req.session && req.session.user) {
        db.query('SELECT * FROM users WHERE email = ?', req.session.user.email, function(err, rows, fields) {
            if (!err) {
                req.user = rows[0];
                delete rows[0].password;
                req.session.user = rows[0];
                res.locals.user = rows[0];
            }
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
  });

app.use('/', index);
app.use('/user', user);
app.use('/files', express.static(__dirname + '/files'));

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

app.get('/all-collections', requireLogin, function(req, res){
    res.sendFile('all-collections.html', { root: __dirname+'/views' });
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

app.get('/loan-reports', requireLogin, function(req, res){
    res.sendFile('loan-reports.html', { root: __dirname+'/views' });
});

app.get('/forgot-password/:id?', function(req, res) {
    res.sendFile('forgot-password.html', {root: __dirname + '/views'});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

module.exports = app;
let server = http.createServer(app);

server.listen(process.env.port || process.env.PORT || 4000, function () {
    console.log('server running on %s [%s]', process.env.PORT, process.env.STATUS);
});