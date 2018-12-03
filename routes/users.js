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
    var postData = req.body; var data = []; data.username = req.body.username; data.email = req.body.email;
    postData.date_created = Date.now(); 
	var query =  'INSERT INTO users Set ?';
	var query2 = 'select * from users where username = ? or email = ?';
	db.query(query2,data, function (error, results, fields) {
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

/* Add New Client */
users.post('/new-client', function(req, res, next) {
    var postData = req.body; var data = []; data.username = req.body.username; data.email = req.body.email;
    postData.date_created = Date.now();
    var query =  'INSERT INTO users Set ?';
    var query2 = 'select * from users where username = ? or email = ?';
    db.query(query2,data, function (error, results, fields) {
        if (results && results[0]){
            res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "Client already exists!"}));
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
                            res.send(JSON.stringify({"response": "Error retrieving client details. Please try a new username!"}));
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
	// console.log(req.body.formData);

	fs.stat('files/users/'+req.params.id+'/', function(err) {
		if (!err) {
			console.log('file or directory exists');
		}
		else if (err.code === 'ENOENT') {
            // console.log('Directory does not exist');
            // console.log('Creating directory ...');
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
                // console.log(req.files.file);
				res.send('File uploaded!');
			});
		}
		else{
			fs.unlink('files/users/'+req.params.id+'/'+req.params.id+'.'+extension,function(err){
				if(err){
				   // console.log(err);
				   res.send('Unable to delete file!');
				} 
				else{
				   sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+'.'+extension, function(err) {
					   if (err)
					   return res.status(500).send(err);
					   // console.log(req.files.file);
					   res.send('File uploaded!');
				   });
				}
				//console.log('file deleted successfully');
		   }); 
		}
		 
	});

	
  });

//File Upload - New Client (Image and Signature)
users.post('/upload-file/:id/:item', function(req, res) {
    if (!req.files) return res.status(400).send('No files were uploaded.');
    if (!req.params) return res.status(400).send('No Number Plate specified!');
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.file;
    let name = sampleFile.name;
    let extArray = sampleFile.name.split(".");
    let extension = extArray[extArray.length - 1];
    let fileName = name+'.'+extension;
    // console.log(req.body.formData);

    fs.stat('files/users/'+req.params.id+'/', function(err) {
        if (!err) {
            console.log('file or directory exists');
        }
        else if (err.code === 'ENOENT') {
            // console.log('Directory does not exist');
            // console.log('Creating directory ...');
            fs.mkdirSync('files/users/'+req.params.id+'/');
        }
    });

    fs.stat('files/users/'+req.params.id+'/'+req.params.id+' '+req.params.item+'.'+extension, function (err) {
        //console.log(stats);//here we got all information of file in stats variable

        if (err) {// If file doesn't exist
            //return console.error(err);
            // Use the mv() method to place the file somewhere on your server
            sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+' '+req.params.item+'.'+extension, function(err) {
                if (err) return res.status(500).send(err);
                // console.log(req.files.file);
                res.send('File uploaded!');
            });
        }
        else{
            fs.unlink('files/users/'+req.params.id+'/'+req.params.id+' '+req.params.item+'.'+extension,function(err){
                if(err){
                    // console.log(err);
                    res.send('Unable to delete file!');
                }
                else{
                    sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+' '+req.params.item+'.'+extension, function(err) {
                        if (err)
                            return res.status(500).send(err);
                        // console.log(req.files.file);
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
    var query = 'SELECT *, (select u.role_name from user_roles u where u.ID = user_role) as Role from users where user_role in (1, 2, 3) order by ID desc';
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

users.get('/officers', function(req, res, next) {
    var query = 'SELECT *, (select u.role_name from user_roles u where u.ID = user_role) as Role from users where user_role = 2 order by ID desc';
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

users.get('/clients-list', function(req, res, next) {
    var query = 'SELECT *, (select u.role_name from user_roles u where u.ID = user_role) as Role from users where user_role = 4 order by ID desc';
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

users.get('/users-list-v2', function(req, res, next) {
    var query = 'SELECT *, (select u.role_name from user_roles u where u.ID = user_role) as Role from users order by fullname asc';
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

/* GET All Requests count. */
users.get('/all-requests', function(req, res, next) {
    var query = 'select count(*) as requests from applications where interest_rate = 0';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(results);
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET All Applications count. */
users.get('/all-applications', function(req, res, next) {
    var query = 'select count(*) as applications from applications where interest_rate != 0';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(results);
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
        workflow_id = req.body.workflowID,
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
                if (!workflow_id)
                    return res.send({"status": 200, "message": "New Application Added!"});
                getNextWorkflowProcess(false,workflow_id,false, function (process) {
                    db.query('SELECT * from applications where ID = LAST_INSERT_ID()', function(err, application, fields) {
                        process.workflowID = workflow_id;
                        process.applicationID = application[0]['ID'];
                        process.date_created = postData.date_created;
                        db.query('INSERT INTO workflow_processes SET ?',process, function (error, results, fields) {
                            if(error){
                                return res.send({"status": 500, "error": error, "response": null});
                            } else {
                                return res.send({"status": 200, "message": "New Application Added!", "response": application[0]});
                            }
                        });
                    });
                });
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
        'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate <> 0 ORDER BY a.ID desc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

users.get('/requests', function(req, res, next) {
    let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
        'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate = 0 ORDER BY a.ID desc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

users.get('/application/:id', function(req, res, next) {
    let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
        'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND u.ID =?';
    db.query(query, [req.params.id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

users.get('/application-id/:id', function(req, res, next) {
    let obj = {},
        application_id = req.params.id,
        path = 'files/application-'+application_id+'/',
        query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
        'a.workflowID, a.loan_amount, a.date_modified, a.comment, a.close_status FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.ID =?';
    db.query(query, [application_id], function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            result = (result[0])? result[0] : {};
            if (!fs.existsSync(path)){
                result.files = {};
                db.query('SELECT * FROM application_schedules WHERE applicationID=?', [application_id], function (error, schedule, fields) {
                    if (error) {
                        res.send({"status": 500, "error": error, "response": null});
                    } else {
                        result.schedule = schedule;
                        db.query('SELECT * FROM schedule_history WHERE applicationID=? AND status=1 ORDER BY ID desc', [application_id], function (error, payment_history, fields) {
                            if (error) {
                                res.send({"status": 500, "error": error, "response": null});
                            } else {
                                result.payment_history = payment_history;
                                return res.send({"status": 200, "message": "User applications fetched successfully!", "response": result});
                            }
                        });
                    }
                });
            } else {
                fs.readdir(path, function (err, files){
                    async.forEach(files, function (file, callback){
                        let filename = file.split('.')[0].split('_');
                        filename.shift();
                        obj[filename.join('_')] = path+file;
                        callback();
                    }, function(data){
                        result.files = obj;
                        db.query('SELECT * FROM application_schedules WHERE applicationID=?', [application_id], function (error, schedule, fields) {
                            if (error) {
                                res.send({"status": 500, "error": error, "response": null});
                            } else {
                                result.schedule = schedule;
                                db.query('SELECT * FROM schedule_history WHERE applicationID=? AND status=1 ORDER BY ID desc', [application_id], function (error, payment_history, fields) {
                                    if (error) {
                                        res.send({"status": 500, "error": error, "response": null});
                                    } else {
                                        result.payment_history = payment_history;
                                        return res.send({"status": 200, "message": "User applications fetched successfully!", "response": result});
                                    }
                                });
                            }
                        });
                    });
                });
            }
        }
    });
});

/* GET User Applications. */
users.get('/applications/filter/:start/:end', function(req, res, next) {
    let start = req.params.start,
		end = req.params.end;
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
	let query = "SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, " +
        "a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate <> 0 " +
			"AND TIMESTAMP(a.date_created) < TIMESTAMP('"+end+"') AND TIMESTAMP(a.date_created) >= TIMESTAMP('"+start+"') ORDER BY a.ID desc";
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

users.get('/requests/filter/:start/:end', function(req, res, next) {
    let start = req.params.start,
        end = req.params.end;
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let query = "SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, " +
        "a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate = 0 " +
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
                'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate <> 0 ORDER BY a.ID desc';
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

users.get('/requests/delete/:id', function(req, res, next) {
    let id = req.params.id,
        date_modified = Date.now(),
        query =  'UPDATE applications SET status=0, date_modified=? where ID=?';
    db.query(query,[date_modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate = 0 ORDER BY a.ID desc';
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
                'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate <> 0 ORDER BY a.ID desc';
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

users.post('/requests/comment/:id', function(req, res, next) {
    let id = req.params.id,
        comment = req.body.comment,
        date_modified = Date.now(),
        query =  'UPDATE applications SET comment=?, date_modified=? where ID=?';
    db.query(query,[comment, date_modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate = 0 ORDER BY a.ID desc';
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

users.get('/application/assign_workflow/:id/:workflow_id', function(req, res, next) {
    let id = req.params.id,
        workflow_id = req.params.workflow_id,
        date_modified = Date.now(),
        query =  'UPDATE applications SET workflowID=?, date_modified=? where ID=?';
    db.query(query,[workflow_id, date_modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            getNextWorkflowProcess(false,workflow_id,false, function (process) {
                process.workflowID = workflow_id;
                process.applicationID = id;
                process.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
                db.query('INSERT INTO workflow_processes SET ?',process, function (error, results, fields) {
                    if(error){
                        res.send({"status": 500, "error": error, "response": null});
                    } else {
                        let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                            'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate <> 0 ORDER BY a.ID desc';
                        db.query(query, function (error, results, fields) {
                            if(error){
                                res.send({"status": 500, "error": error, "response": null});
                            } else {
                                res.send({"status": 200, "message": "Workflow assigned successfully!", "response": results});
                            }
                        });
                    }
                });
            });
        }
    });
});

users.get('/request/assign_workflow/:id/:workflow_id', function(req, res, next) {
    let id = req.params.id,
        workflow_id = req.params.workflow_id,
        date_modified = Date.now(),
        query =  'UPDATE applications SET workflowID=?, date_modified=? where ID=?';
    db.query(query,[workflow_id, date_modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            getNextWorkflowProcess(false,workflow_id,false, function (process) {
                process.workflowID = workflow_id;
                process.applicationID = id;
                process.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
                db.query('INSERT INTO workflow_processes SET ?',process, function (error, results, fields) {
                    if(error){
                        res.send({"status": 500, "error": error, "response": null});
                    } else {
                        let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                            'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM users AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 AND a.interest_rate = 0 ORDER BY a.ID desc';
                        db.query(query, function (error, results, fields) {
                            if(error){
                                res.send({"status": 500, "error": error, "response": null});
                            } else {
                                res.send({"status": 200, "message": "Workflow assigned successfully!", "response": results});
                            }
                        });
                    }
                });
            });
        }
    });
});

users.post('/workflow_process/:application_id/:workflow_id', function(req, res, next) {
    let stage = req.body.stage,
        user_role = req.body.user_role,
        workflow_id = req.params.workflow_id,
        application_id = req.params.application_id;
    if (!application_id || !workflow_id || !user_role)
        return res.send({"status": 500, "error": "Required Parameter(s) not sent!"});
    if (!stage || (Object.keys(stage).length === 0 && stage.constructor === Object))
        stage = false;
    getNextWorkflowProcess(application_id,workflow_id,stage, function (process) {
        process.workflowID = workflow_id;
        process.applicationID = application_id;
        if (!process.approver_id || (process.approver_id === 0))
            process.approver_id = 1;
        process.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
        db.query('SELECT * FROM workflow_processes WHERE ID = (SELECT MAX(ID) FROM workflow_processes WHERE applicationID=? AND status=1)', [application_id], function (error, last_process, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                db.query('UPDATE workflow_processes SET approval_status=? WHERE ID=? AND status=1',[1,last_process[0]['ID']], function (error, status, fields) {
                    if(error){
                        res.send({"status": 500, "error": error, "response": null});
                    } else {
                        if (parseInt(process.approver_id) !== parseInt(user_role))
                            return res.send({"status": 500, "message": "You do not have authorization rights"});
                        delete process.approver_id;
                        db.query('INSERT INTO workflow_processes SET ?',process, function (error, results, fields) {
                            if(error){
                                res.send({"status": 500, "error": error, "response": null});
                            } else {
                                res.send({"status": 200, "message": "Workflow Process created successfully!"});
                            }
                        });
                    }
                });
            }
        });
    });
});

users.get('/revert_workflow_process/:application_id', function(req, res, next) {
    let query = 'SELECT * FROM workflow_processes WHERE ID = (SELECT MAX(ID) FROM workflow_processes WHERE applicationID=? AND status=1)';
    db.query(query, [req.params.application_id], function (error, last_process, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query('UPDATE workflow_processes SET status=? WHERE ID=?',[0,last_process[0]['ID']], function (error, results, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "message": "Workflow Process reverted successfully!", "response": null});
                }
            });
        }
    });
});

users.get('/workflow_process/:application_id', function(req, res, next) {
    let query = 'SELECT * FROM workflow_processes WHERE applicationID = ? AND status=1';
    db.query(query, [req.params.application_id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Workflow Process fetched successfully!", "response": results});
        }
    });
});

users.get('/workflow_process_all/:application_id', function(req, res, next) {
    let query = 'SELECT * FROM workflow_processes WHERE applicationID = ?';
    db.query(query, [req.params.application_id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "All Workflow Process fetched successfully!", "response": results});
        }
    });
});

function getNextWorkflowProcess(application_id,workflow_id,stage, callback){
    db.query('SELECT * FROM workflow_stages WHERE workflowID=? ORDER BY ID asc',[workflow_id], function (error, stages, fields) {
        if(stages){
            if(application_id && !stage){
                db.query('SELECT * FROM workflow_processes WHERE ID = (SELECT MAX(ID) FROM workflow_processes WHERE applicationID=? AND status=1)',[application_id], function (error, application_last_process, fields) {
                    if (application_last_process){
                        let next_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(application_last_process[0]['next_stage'])),
                            current_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(application_last_process[0]['current_stage']));
                        if (stages[next_stage_index+1]){
                            if (application_last_process[0]['next_stage'] !== stages[next_stage_index+1]['stageID']){//current stage must not be equal to next stage
                                callback({previous_stage:application_last_process[0]['current_stage'],current_stage:application_last_process[0]['next_stage'],next_stage:stages[next_stage_index+1]['stageID'], approver_id:stages[current_stage_index]['approverID']});
                            } else {
                                if (stages[next_stage_index+2]){
                                    callback({previous_stage:application_last_process[0]['current_stage'],current_stage:application_last_process[0]['next_stage'],next_stage:stages[next_stage_index+2]['stageID'], approver_id:stages[current_stage_index]['approverID']});
                                } else {
                                    callback({previous_stage:application_last_process[0]['current_stage'],current_stage:application_last_process[0]['next_stage'], approver_id:stages[current_stage_index]['approverID']});
                                }
                            }
                        } else {
                            callback({previous_stage:application_last_process[0]['current_stage'],current_stage:application_last_process[0]['next_stage'], approver_id:stages[current_stage_index]['approverID']});
                        }
                    } else {
                        callback({});
                    }
                });
            } else if(application_id && stage){
                let current_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(stage['current_stage'])),
                    next_stage_index = current_stage_index+1;
                if (stage['next_stage']){
                    callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stage['next_stage'], approver_id:stages[current_stage_index]['approverID']});
                }else if (stages[next_stage_index]){
                    if (stage['current_stage'] !== stages[next_stage_index]['stageID']){
                        callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stages[next_stage_index]['stageID'], approver_id:stages[current_stage_index]['approverID']});
                    } else {
                        if (stages[next_stage_index+1]){
                            callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stages[next_stage_index+1]['stageID'], approver_id:stages[current_stage_index]['approverID']});
                        } else {
                            callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'], approver_id:stages[current_stage_index]['approverID']});
                        }
                    }
                } else {
                    callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'], approver_id:stages[current_stage_index]['approverID']});
                }
            } else {
                callback({current_stage:stages[0]['stageID'],next_stage:stages[1]['stageID']});
            }
        } else {
            callback({})
        }
    });
}

users.post('/application/comments/:id', function(req, res, next) {
    db.query('SELECT * FROM applications WHERE ID = ?', [req.params.id], function (error, application, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query('INSERT INTO application_comments SET ?', [{applicationID:req.params.id,userID:application[0]['userID'],text:req.body.text,date_created:moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a')}],
                function (error, response, fields) {
                    if(error || !response)
                        res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
                    db.query('SELECT c.text, c.date_created, u.fullname FROM application_comments AS c, users AS u WHERE c.applicationID = ? AND c.userID=u.ID ORDER BY c.ID desc', [req.params.id], function (error, comments, fields) {
                        if(error){
                            res.send({"status": 500, "error": error, "response": null});
                        } else {
                            res.send({"status": 200, "message": "Application commented successfully!", "response": comments});
                        }
                    })
                });
        }
    });
});

users.get('/application/comments/:id', function(req, res, next) {
    db.query('SELECT c.text, c.date_created, u.fullname FROM application_comments AS c, users AS u WHERE c.applicationID = ? AND c.userID=u.ID ORDER BY c.ID desc', [req.params.id], function (error, comments, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Application comments fetched successfully!", "response": comments});
        }
    })
});

users.post('/application/schedule/:id', function(req, res, next) {
    db.query('SELECT * FROM application_schedules WHERE applicationID = ? AND status = 1', [req.params.id], function (error, invoices, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            async.forEach(invoices, function (invoice, callback) {
                db.query('UPDATE application_schedules SET status=0 WHERE ID = ?', [invoice.ID], function (error, response, fields) {
                   callback();
                });
            }, function (data) {
                let count = 0;
                async.forEach(req.body.schedule, function (obj, callback2) {
                    obj.applicationID = req.params.id;
                    db.query('INSERT INTO application_schedules SET ?', obj, function (error, response, fields) {
                            if(!error)
                                count++;
                            callback2();
                        });
                }, function (data) {
                    res.send({"status": 200, "message": "Application scheduled with "+count+" invoices successfully!", "response": null});
                })
            });
        }
    });
});

users.get('/application/schedule/:id', function(req, res, next) {
    db.query('SELECT * FROM application_schedules WHERE applicationID = ? AND status = 1', [req.params.id], function (error, schedule, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Application schedule fetched successfully!", "response": schedule});
        }
    });
});

users.get('/application/confirm-payment/:id', function(req, res, next) {
    db.query('UPDATE application_schedules SET payment_status=1 WHERE ID = ?', [req.params.id], function (error, invoice, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Invoice Payment confirmed successfully!"});
        }
    });
});

users.post('/application/confirm-payment/:id/:application_id/:agent_id', function(req, res, next) {
    let data = req.body;
    data.payment_status = 1;
    db.query('UPDATE application_schedules SET ? WHERE ID = '+req.params.id, data, function (error, invoice, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let invoice = {};
            invoice.invoiceID = req.params.id;
            invoice.agentID = req.params.agent_id;
            invoice.applicationID = req.params.application_id;
            invoice.payment_amount = data.actual_payment_amount;
            invoice.interest_amount = data.actual_interest_amount;
            invoice.fees_amount = data.actual_fees_amount;
            invoice.penalty_amount = data.actual_penalty_amount;
            invoice.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
            db.query('INSERT INTO schedule_history SET ?', invoice, function (error, response, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "message": "Invoice Payment confirmed successfully!"});
                }
            });
        }
    });
});

users.post('/application/disburse/:id', function(req, res, next) {
    let data = req.body;
    data.status = 2;
    db.query('UPDATE applications SET ? WHERE ID = '+req.params.id, data, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Loan disbursed successfully!"});
        }
    });
});

users.get('/application/invoice-history/:id', function(req, res, next) {
    db.query('SELECT s.ID, s.invoiceID, s.payment_amount, s.interest_amount, s.fees_amount, s.penalty_amount, s.date_created, s.status,' +
        's.applicationID, u.fullname AS agent FROM schedule_history AS s, users AS u WHERE s.agentID=u.ID AND invoiceID = ? ORDER BY ID desc', [req.params.id], function (error, history, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Invoice history fetched successfully!", "response":history});
        }
    });
});

users.get('/application/payment-reversal/:id', function(req, res, next) {
    db.query('UPDATE schedule_history SET status=0 WHERE ID=?', [req.params.id], function (error, history, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Payment reversed successfully!", "response":history});
        }
    });
});

users.post('/application/pay-off/:id', function(req, res, next) {
    let data = req.body;
    data.close_status = 1;
    db.query('UPDATE applications SET ? WHERE ID = '+req.params.id, data, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query('SELECT * FROM application_schedules WHERE applicationID = ? AND status = 1 AND payment_status = 0', [req.params.id], function (error, invoices, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    async.forEach(invoices, function (invoice_obj, callback) {
                        let invoice = {};
                        invoice.invoiceID = invoice_obj.ID;
                        invoice.applicationID = req.params.id;
                        invoice.payment_amount = invoice_obj.payment_amount;
                        invoice.interest_amount = invoice_obj.interest_amount;
                        invoice.fees_amount = invoice_obj.fees_amount;
                        invoice.penalty_amount = invoice_obj.penalty_amount;
                        invoice.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
                        db.query('UPDATE application_schedules SET payment_status=1 WHERE ID = ?', [invoice_obj.ID], function (error, result, fields) {
                            db.query('INSERT INTO schedule_history SET ?', invoice, function (error, response, fields) {
                                callback();
                            });
                        });
                    }, function (data) {
                        res.send({"status": 200, "message": "Application write off successful!"});
                    });
                }
            });
        }
    });
});

users.post('/application/write-off/:id', function(req, res, next) {
    let data = req.body;
    data.close_status = 2;
    db.query('UPDATE applications SET ? WHERE ID = '+req.params.id, data, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Application write off successful!"});
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