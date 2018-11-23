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
// var app = express();

// // This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// // This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
// app.use((req, res, next) => {
//     if (req.cookies.user_sid && !req.session.user) {
//         res.clearCookie('user_sid');        
//     }
//     next();
// });

// // middleware function to check for logged-in users
// var sessionChecker = (req, res, next) => {
//     if (req.session.user && req.cookies.user_sid) {
//         res.redirect('/dashboard');
//     } else {
//         next();
//     }    
// };

// // route for Home-Page
// app.get('/', sessionChecker, (req, res) => {
//     res.redirect('/login');
// });

// // route for user Login
// app.route('/login-admin')
//     .get(sessionChecker, (req, res) => {
//         res.sendFile(__dirname + '/views/login.html');
//     })
//     .post((req, res) => {
//         var username = req.body.username,
//             password = req.body.password;

//             var user = {};
        
//         db.query('SELECT * FROM users WHERE username = ?', [username], function(err, rows, fields) {
//             if (err) {
//                 res.redirect('/login');
//             } else if (rows.length == 0) {
//                 res.redirect('/login');
//             } else {
//                 user = rows[0];
//                 req.session.user = user;
//                 res.redirect('/dashboard');
//             }
//         });
//     });

// // route for user's dashboard
// app.get('/dashboard', (req, res) => {
//     if (req.session.user && req.cookies.user_sid) {
//         res.sendFile(__dirname + '/views/index.html');
//     } else {
//         res.redirect('/login');
//     }
// });


// // route for user logout
// app.get('/logout', (req, res) => {
//     if (req.session.user && req.cookies.user_sid) {
//         res.clearCookie('user_sid');
//         res.redirect('/');
//     } else {
//         res.redirect('/login');
//     }
// });

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
	var query2 = 'select * from users where username = ?';
	db.query(query2,req.body.username, function (error, results, fields) {
		if (results && results[0]){
			res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "User already exists!"}));
		}
		else {
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
		}
	});
});

/* Add New User Role*/
users.post('/new-role', function(req, res, next) {
    var postData = req.body;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a')
    var query =  'INSERT INTO user_roles Set ?';
    var query2 = 'select * from user_roles where role_name = ?';
    db.query(query2,req.body.role, function (error, results, fields) {
        if (results && results[0]){
            res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "Role name already exists!"}));
        }
        else {
            db.query(query,{"role_name":postData.role, "date_created": postData.date_created}, function (error, results, fields) {
                if(error){
                    res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
                    //If there is error, we send the error in the error section with 500 status
                } else {
                    res.send(JSON.stringify({"status": 200, "error": null, "response": "New User Role Added!"}));
                    //If there is no error, all is good and response is 200OK.
                }
            });
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

users.get('/user-dets/:id', function(req, res, next) {
    var query = 'SELECT *, (select u.role_name from user_roles u where u.ID = user_role) as Role from users where id = ? order by ID desc ';
	db.query(query, req.params.id, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
			  //res.send({"status": 200, "message": "User details fetched successfully!", "response": results});
			  res.send(results);
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

users.get('/roles/:role', function(req, res, next) {
    var query = 'SELECT * from user_roles where not id = ?';
    db.query(query, req.params.role, function (error, results, fields) {
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
users.post('/edit-user/:id', function(req, res, next) {
	var postData = req.body;    
	let date = Date.now();
    var payload = [postData.username, postData.fullname, postData.phone, postData.address, postData.user_role, postData.email, postData.date_modified, req.params.id];
    var query = 'Update users SET username = ?, fullname=?, phone=?, address = ?, user_role=?, email=?, date_modified = ? where id=?';
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

/* Change User Password */
users.post('/changePassword/:id', function(req, res, next) {
	var postData = req.body;
	let date_modified = Date.now();  
    var payload = [postData.username, postData.name, postData.password, postData.id];
    var query = 'Update users SET password = ?, date_modified = ?  where id=?';
    db.query(query, [req.body.password, date_modified, req.params.id], function (error, results, fields) {                   ;
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send({"status": 200, "error": null, "response": results, "message": "User password updated!"});
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
		postData = Object.assign({},req.body),
        query =  'INSERT INTO applications Set ?';
    delete postData.email;
    delete postData.username;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query(query, postData, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            data.name = req.body.username;
            data.date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
            let mailOptions = {
                from: 'no-reply Loan35 <applications@loan35.com>',
                to: req.body.email,
                subject: 'Loan35 Application Successful',
                template: 'main',
                context: data
            };

            transporter.sendMail(mailOptions, function(error, info){
            	if(error)
            		return res.send({"status": 500, "message": "Error occurred!", "response": error});
                return res.send({"status": 200, "message": "New Application Added!"});
            });
        }
    });
});

users.post('/apply', function(req, res) {
    let data = {},
        postData = Object.assign({},req.body),
        query =  'INSERT INTO applications Set ?';
    delete postData.email;
    delete postData.username;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query(query, postData, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            data.name = req.body.username;
            data.date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
            let mailOptions = {
                from: 'no-reply Loan35 <applications@loan35.com>',
                to: req.body.email,
                subject: 'Loan35 Application Successful',
                template: 'main',
                context: data
            };

            transporter.sendMail(mailOptions, function(error, info){
                if(error)
                    return res.send({"status": 500, "message": "Error occurred!", "response": error});
                return res.send({"status": 200, "message": "New Application Added!"});
            });
        }
    });
});

users.post('/contact', function(req, res) {
    let data = req.body;
    if (!data.fullname || !data.email || !data.subject || !data.message)
    	return res.send({"status": 500, "message": "Please send all required parameters"});
    data.date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let mailOptions = {
        from: data.fullname+' <applications@loan35.com>',
        to: 'getloan@loan35.com',
        subject: 'Feedback: '+data.subject,
        template: 'contact',
        context: data
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error)
            return res.send({"status": 500, "message": "Oops! An error occurred while sending feedback", "response": error});
        return res.send({"status": 200, "message": "Feedback sent successfully!"});
    });
});

users.post('/sendmail', function(req, res) {
    let data = req.body;
    if (data['solution[]'])
        data.solution = data['solution[]'];
    if (!data.name || !data.email || !data.company || !data.phone || !data.solution || !data.description)
        return res.send("Error");
    if (data.solution.constructor === [].constructor)
        data.solution = data.solution.join(',');
    data.date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let mailOptions = {
        from: 'ATB Cisco <applications@loan35.com>',
        to: 'abiodun@atbtechsoft.com',
        subject: 'ATB Cisco Application: '+data.name,
        template: 'mail',
        context: data
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error)
            return res.send("Error");
        return res.send("OK");
    });
});

/* GET User Applications. */
users.get('/applications', function(req, res, next) {
    let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
        'a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

/* GET User Applications. */
users.get('/applications/filter/:start/:end', function(req, res, next) {
    let start = req.params.start,
		end = req.params.end;
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
	let query = "SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, " +
        "a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 " +
			"AND TIMESTAMP(a.date_created) < TIMESTAMP('"+end+"') AND TIMESTAMP(a.date_created) >= TIMESTAMP('"+start+"') ORDER BY a.ID desc";
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

users.get('/applications/delete/:id', function(req, res, next) {
    let id = req.params.id,
        date_modified = Date.now(),
        query =  'UPDATE applications SET status=0, date_modified=? where ID=?';
    db.query(query,[date_modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                'a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
            db.query(query, function (error, results, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "message": "Application archived successfully!", "response": results});
                }
            });
        }
    });
});

users.post('/applications/comment/:id', function(req, res, next) {
    let id = req.params.id,
		comment = req.body.comment,
        date_modified = Date.now(),
        query =  'UPDATE applications SET comment=?, date_modified=? where ID=?';
    db.query(query,[comment, date_modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                'a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
            db.query(query, function (error, results, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "message": "Application commented successfully!", "response": results});
                }
            });
        }
    });
});

// users.use(function(req, res, next) {
//     var token = req.body.token || req.headers['token'];
//     var appData = {};
//     if (token) {
//         jwt.verify(token, process.env.SECRET_KEY, function(err) {
//             if (err) {
//                 appData["error"] = 1;
//                 appData["data"] = "Token is invalid";
//                 res.status(500).json(appData);
//             } else {
//                 next();
//             }
//         });
//     } else {
//         appData["error"] = 1;
//         appData["data"] = "Please send a token";
//         res.status(403).json(appData);
//     }
// });



module.exports = users;