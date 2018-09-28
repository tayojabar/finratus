var express = require('express');
var users = express.Router();
var async = require('async');
var db = require('../db');
var jwt = require('jsonwebtoken');
var token;
const fs = require('fs');
var path = require('path');
var moment  = require('moment');
var nodemailer = require('nodemailer'),
	smtpTransport = require('nodemailer-smtp-transport'),
	hbs = require('nodemailer-express-handlebars'),
	smtpConfig = smtpTransport({
		service: 'Mailjet',
		auth: {
			user: process.env.MAILJET_KEY,
			pass: process.env.MAILJET_SECRET
		}
	}),
	options = {
		viewPath: 'views/email',
		extName: '.hbs'
	};
	transporter = nodemailer.createTransport(smtpConfig);
transporter.use('compile', hbs(options));

process.env.SECRET_KEY = "devesh";

/* User Authentication */
users.post('/login', function(req, res) {
    var appData = {};
    var username = req.body.username;
    var password = req.body.password;
    var user = {};
    
    db.query('SELECT * FROM users WHERE username = ?', [username], function(err, rows, fields) {
            if (err) {
                console.log(err)
                appData.error = 1;
                appData["data"] = "Error Occured!";
                //res.status(400).json(appData);
                res.send(JSON.stringify(appData));
            } else {
                user = rows[0];
                if (rows.length > 0) {
                    if (user.password == password) {
                        let token = jwt.sign({data:user}, process.env.SECRET_KEY, {
                            expiresIn: 1440
                        });
                        appData.status = 0;
                        appData["token"] = token;
                        appData["user"] = user;
                        // res.status(200).json(appData);
                        res.send(JSON.stringify(appData));
                    } else {
                        appData.status = 1;
                        appData["data"] = "Username and Password do not match";
                        // res.status(204).json(appData);
                        res.send(JSON.stringify(appData)); 
                    }
                } else {
                    appData.status = 1;
                    appData["data"] = "User does not exists!";
                    //res.status(204).json(appData);
                    res.send(JSON.stringify(appData)); 
                }
            }
        });
   // connection.release();
});

/* Add New User */
users.post('/new-user', function(req, res, next) {
    var postData = req.body; 
    postData.date_created = Date.now(); 
    var query =  'INSERT INTO users Set ?';
	db.query(query,postData, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
			db.query('SELECT * from users where ID = LAST_INSERT_ID()', function(err, re, fields) {
				if (!err){
					res.send(JSON.stringify({"status": 200, "error": null, "response": re}));
				}
				else{
					res.send(JSON.stringify({"response": "Error retrieving user details. Please try a new username!"}));
				}
			});
  			//res.send(JSON.stringify({"status": 200, "error": null, "response": "New User Added"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

//File Upload - User Registration
users.post('/upload/:id', function(req, res) {
	if (!req.files) return res.status(400).send('No files were uploaded.');
	if (!req.params) return res.status(400).send('No Number Plate specified!');
	// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
	let sampleFile = req.files.file;
	let name = sampleFile.name;
	let extArray = sampleFile.name.split(".");
    let extension = extArray[extArray.length - 1];
	let fileName = name+'.'+extension;
	//console.log(name);

	fs.stat('files/users/'+req.params.id+'/', function(err) {
		if (!err) {
			console.log('file or directory exists');
		}
		else if (err.code === 'ENOENT') {
			console.log('Directory does not exist');
            console.log('Creating directory ...');
            fs.mkdirSync('files/users/'+req.params.id+'/');
		}
    });
   
	fs.stat('files/users/'+req.params.id+'/'+req.params.id+'.'+extension, function (err) {
		//console.log(stats);//here we got all information of file in stats variable
	 
		if (err) {// If file doesn't exist
			//return console.error(err);
			// Use the mv() method to place the file somewhere on your server
			sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+'.'+extension, function(err) {
				if (err) return res.status(500).send(err);
                console.log(req.files.file);
				res.send('File uploaded!');
			});
		}
		else{
			fs.unlink('files/users/'+req.params.id+'/'+req.params.id+'.'+extension,function(err){
				if(err){
				   console.log(err);
				   res.send('Unable to delete file!');
				} 
				else{
				   sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+'.'+extension, function(err) {
					   if (err)
					   return res.status(500).send(err);
					   console.log(req.files.file);
					   res.send('File uploaded!');
				   });
				}
				//console.log('file deleted successfully');
		   }); 
		}
		 
	});

	
  });

/* GET users listing. */
users.get('/all-users', function(req, res, next) {
	var query = 'SELECT * from users';
	var array = [];
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
          } 
        else {
            async.forEach(results, function(k, cb){
                var path = 'files/users/'+k.username+'/';
                if (fs.existsSync(path)){
                    fs.readdir(path, function (err, files){
                        async.forEach(files, function (file, callback){
							k.image = path+file;
							callback();
						}, function(data){
							array.push(k);
							cb();
						});
                    });
                }
                else {
					k.image = "No Image";
					array.push(k);
					cb();
                }
                
            }, function(data){
				res.send(JSON.stringify({"status": 200, "error": null, "response": array}));
            //If there is no error, all is good and response is 200OK.
			});
	  	}
  	});
});

users.get('/users-list', function(req, res, next) {
    var query = 'SELECT *, (select u.role_name from user_roles u where u.ID = user_role) as Role from users order by ID desc';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify(results));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

users.get('/user-roles', function(req, res, next) {
    var query = 'SELECT * from user_roles';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify(results));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/* GET users count. */
users.get('/usersCount', function(req, res, next) {
    var query = 'SELECT count(*) as total from users';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify(results));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/* GET Specific User. */
users.get('/user/:id', function(req, res, next) {
    var query = 'SELECT * from users where username = ?';
    var path = 'files/users/'+req.params.id+'/';
	db.query(query, [req.params.id], function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
            fs.stat(path, function(err) {
				
				if (!err){
					var items = [];
                    var obj = {};
                    var image = "";
					fs.readdir(path, function (err, files){
						files.forEach(function (file){
							image = path+file;
							// let part = file.split('.')[0].split('_')[1];
							// obj[part] = file;
						});
						//console.log(items);
						//listDirectoryItems(path);
						res.send(JSON.stringify({"status": 200, "error": null, "response": results, "image": image}));
					})	;
					//items = getdirectoryItems(path, req, res);
				}else{
				res.send(JSON.stringify({"status": 200, "error": null, "response": results, "path": "No Image Uploaded Yet"}));
				}
			});
  			//res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/* Edit User Info */
users.post('/editUser/:id', function(req, res, next) {
    var postData = req.body;    
    var payload = [postData.username, postData.name, postData.password, postData.id];
    var query = 'Update users SET username = ?, name=?, password=? where id=?';
    db.query(query, payload, function (error, results, fields) {                   ;
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "User Details Updated"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/* GET Vehicle Owners listing. */
users.get('/owners/', function(req, res, next) {
    var query = 'SELECT * from users where user_role = 4';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
			res.send(JSON.stringify(results));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/* Add New Vehicle Owner*/
users.post('/new-owner', function(req, res, next) {
    var postData = req.body;  
    postData.date_created = Date.now();
	payload = [];
    var query =  'INSERT INTO vehicle_owners Set ?';
	db.query(query,postData, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "New Vehicle Owner Added!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/**
 * User Application (3rd Party)
 * Payload => Firstname, Lastname, Phone, Collateral
 */

users.post('/apply', function(req, res) {
    let data = {},
		postData = req.body,
        query =  'INSERT INTO applications Set ?';
    delete postData.email;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query(query, postData, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            data.name = postData.username;
            data.date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
            let mailOptions = {
                from: 'no-reply Loan35 <applications@loan35.com>',
                to: req.body.email,
                subject: 'Loan35 Application Successful',
                template: 'main',
                context: data
            };

            transporter.sendMail(mailOptions, function(error, info){
            	console.log(info);
                res.send({"status": 200, "message": "New Application Added!"});
            });
        }
    });
});

/* GET User Applications. */
users.get('/applications', function(req, res, next) {
    let query = 'SELECT * FROM applications INNER JOIN users ON users.ID=applications.userID';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

users.use(function(req, res, next) {
    var token = req.body.token || req.headers['token'];
    var appData = {};
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function(err) {
            if (err) {
                appData["error"] = 1;
                appData["data"] = "Token is invalid";
                res.status(500).json(appData);
            } else {
                next();
            }
        });
    } else {
        appData["error"] = 1;
        appData["data"] = "Please send a token";
        res.status(403).json(appData);
    }
});



module.exports = users;