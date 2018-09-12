var express = require('express');
var users = express.Router();
var db = require('../db');
var jwt = require('jsonwebtoken');
var token;
const fs = require('fs');
var path = require('path');

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
    var query =  'INSERT INTO users Set ?';
	db.query(query,postData, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "New User Added"}));
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
	let extArray = sampleFile.mimetype.split("/");
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
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
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
users.get('/:id', function(req, res, next) {
    var query = 'SELECT * from users where id = ?';
	db.query(query, [req.params.id], function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
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
users.get('/owners', function(req, res, next) {
    var query = 'SELECT * from vehicle_owners';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/* Add New Vehicle Owner*/
users.post('/new-owner', function(req, res, next) {
	var postData = req.body;  
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