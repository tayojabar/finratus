const express = require('express');
let token,
    fs = require('fs'),
    db = require('../db'),
    path = require('path'),
    users = express.Router(),
    async = require('async'),
    moment  = require('moment'),
    bcrypt = require('bcryptjs'),
    jwt = require('jsonwebtoken'),
    nodemailer = require('nodemailer'),
	hbs = require('nodemailer-express-handlebars'),
    smtpTransport = require('nodemailer-smtp-transport'),
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

users.get('/import-bulk-clients', function(req, res) {
let clients = [],
    count=0,
    errors = [];

    db.getConnection(function(err, connection) {
        if (err) throw err;
        async.forEach(clients, function (client, callback) {
            client.status = 1;
            delete client.ID;
            delete client.user_role;
            delete client.comment;
            delete client.date_modified;
            delete client.address;
            console.log(client.fullname);
            connection.query('INSERT INTO clients SET ?', client, function (err, result, fields) {
                if (err) {
                    console.log(err);
                    errors.push(client);
                } else {
                    count++;
                }
                callback();
            });
        }, function (data) {
            connection.release();
            res.json({count: count, errors: errors})
        })
    });
});

users.get('/bulk-update-clients', function(req, res) {
    let clients = [],
        count=0,
        errors = [];

    db.getConnection(function(err, connection) {
        if (err) throw err;
        async.forEach(clients, function (client, callback) {
            console.log(client.fullname);
            switch (client.loan_officer){
                case "Abiodun Atobatele":{client.loan_officer = 2; break;}
                case "Afeez Ishola":{client.loan_officer = 6; break;}
                case "Ayokunnumi Olugbemiro":{client.loan_officer = 3; break;}
                case "Blessing Ebulueye":{client.loan_officer = 5; break;}
                case "Blessing Ebilueye":{client.loan_officer = 5; break;}
                case "Damola Sunday":{client.loan_officer = 7; break;}
            }
            console.log(client.loan_officer);
            connection.query('UPDATE clients SET loan_officer=? WHERE substring_index(fullname," ",2)=?', [client.loan_officer,client.fullname], function (err, result, fields) {
                if (err) {
                    console.log(err);
                    errors.push(client);
                } else {
                    count++;
                }
                callback();
            });
        }, function (data) {
            connection.release();
            res.json({count: count, errors: errors})
        });
    });
});

users.get('/update-request-client', function(req, res) {
    let users = [],
        count=0,
        errors = [];
    db.getConnection(function(err, connection) {
        async.forEach(users, function (user, callback) {
            console.log(user.fullname);
            connection.query('SELECT * FROM clients WHERE username = ?', [user.username], function (err, client, field) {
                if (client && client[0]){
                    connection.query('UPDATE requests SET userID = ? WHERE userID = ?', [client[0]['ID'],user['ID']], function (err, result, fields) {
                        if (err) {
                            console.log(err);
                            errors.push(user);
                        } else {
                            count++;
                        }
                        callback();
                    })
                } else {
                    console.log('No Client found for '+user.fullname);
                    callback();
                }
            });
        }, function (data) {
            connection.release();
            res.json({count: count, errors: errors})
        });
    });
});

/* User Authentication */
users.post('/login', function(req, res) {
    let user = {},
        appData = {},
        username = req.body.username,
        password = req.body.password;
    
    db.query('SELECT * FROM users WHERE username = ?', [username], function(err, rows, fields) {
            if (err) {
                appData.error = 1;
                appData["data"] = "Error Occured!";
                res.send(JSON.stringify(appData));
            } else {
                user = rows[0];
                if (rows.length > 0) {
                    if (bcrypt.compareSync(password,user.password)) {
                        let token = jwt.sign({data:user}, process.env.SECRET_KEY, {
                            expiresIn: 1440
                        });
                        appData.status = 0;
                        appData["token"] = token;
                        appData["user"] = user;
                        res.send(JSON.stringify(appData));
                    } else {
                        appData.status = 1;
                        appData["data"] = "Username and Password do not match";
                        res.send(JSON.stringify(appData)); 
                    }
                } else {
                    appData.status = 1;
                    appData["data"] = "User does not exists!";
                    res.send(JSON.stringify(appData)); 
                }
            }
        });
});

/* Add New User */
users.post('/new-user', function(req, res, next) {
    let data = [],
        postData = req.body,
        query =  'INSERT INTO users Set ?',
        query2 = 'select * from users where username = ? or email = ?';
    data.username = req.body.username;
    data.email = req.body.email;
    postData.status = 1;
    postData.date_created = Date.now();
    postData.password = bcrypt.hashSync(postData.password, parseInt(process.env.SALT_ROUNDS));
    db.getConnection(function(err, connection) {
        if (err) throw err;

        connection.query(query2,data, function (error, results, fields) {
            if (results && results[0]){
                res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "User already exists!"}));
            }
            else {
                connection.query(query,postData, function (error, results, fields) {
                    if(error){
                        res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
                } else {
                        connection.query('SELECT * from users where ID = LAST_INSERT_ID()', function(err, re, fields) {
                            connection.release();
                            if (!err){
                                res.send(JSON.stringify({"status": 200, "error": null, "response": re}));
                            }
                            else{
                                res.send(JSON.stringify({"response": "Error retrieving user details. Please try a new username!"}));
                            }
                        });
                    }
                });
            }
        });
    });
});

/* Add New Client */
users.post('/new-client', function(req, res, next) {
    let postData = req.body,
        query =  'INSERT INTO clients Set ?',
        query2 = 'select * from clients where username = ? or email = ? or phone = ?';
    postData.status = 1;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');

    db.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(query2,[req.body.username, req.body.email, req.body.phone], function (error, results, fields) {
            if (results && results[0]){
                return res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "Information in use by existing client!"}));
            }
            connection.query(query,postData, function (error, re, fields) {
                if(error){
                    console.log(error);
                    res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
                } else {
                    res.send(JSON.stringify({"status": 200, "error": null, "response": re}));
                }
            });
        });
    });
});

/* Add New Team*/
users.post('/new-team', function(req, res, next) {
    let postData = req.body,
        query =  'SELECT * FROM teams WHERE name = ? AND status = 1';
        query2 =  'INSERT INTO teams Set ?';
    postData.status = 1;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query(query,[postData.name], function (error, team, fields) {
        if(team && team[0]){
            res.send({"status": 500, "error": "Team already exists!"});
        } else {
            db.query(query2,postData, function (error, results, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "error": null, "response": "New Team Added!"});
                }
            });
        }
    });
});

/* Add New User Role*/
users.post('/new-role', function(req, res, next) {
    let postData = req.body,
        query =  'INSERT INTO user_roles Set ?',
        query2 = 'select * from user_roles where role_name = ?';
    postData.status = 1;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query(query2,req.body.role, function (error, results, fields) {
        if (results && results[0])
            return res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "Role name already exists!"}));
        db.query(query,{"role_name":postData.role, "date_created": postData.date_created, "status": 1}, function (error, results, fields) {
            if(error){
                res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            } else {
                res.send(JSON.stringify({"status": 200, "error": null, "response": "New User Role Added!"}));
            }
        });
    });
});

/* Add New Branch*/
users.post('/new-branch', function(req, res, next) {
    let postData = req.body,
        query =  'INSERT INTO branches Set ?',
        query2 = 'select * from branches where branch_name = ?';
    postData.status = 1;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query(query2,req.body.branch_name, function (error, results, fields) {
        if (results && results[0])
            return res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "Branch name already exists!"}));
        db.query(query,{"branch_name":postData.branch_name, "date_created": postData.date_created, "status": 1}, function (error, results, fields) {
            if(error){
                res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            } else {
                res.send(JSON.stringify({"status": 200, "error": null, "response": "New Branch Created!"}));
            }
        });
    });
});

//File Upload - User Registration
users.post('/upload/:id', function(req, res) {
	if (!req.files) return res.status(400).send('No files were uploaded.');
	if (!req.params) return res.status(400).send('No Number Plate specified!');
	let sampleFile = req.files.file,
        name = sampleFile.name,
        extArray = sampleFile.name.split("."),
        extension = extArray[extArray.length - 1],
        fileName = name+'.'+extension;

	fs.stat('files/users/'+req.params.id+'/', function(err) {
		if (!err) {
			console.log('file or directory exists');
		} else if (err.code === 'ENOENT') {
            fs.mkdirSync('files/users/'+req.params.id+'/');
		}
    });
   
	fs.stat('files/users/'+req.params.id+'/'+req.params.id+'.'+extension, function (err) {
		if (err) {
			sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+'.'+extension, function(err) {
				if (err) return res.status(500).send(err);
				res.send('File uploaded!');
			});
		}
		else{
			fs.unlink('files/users/'+req.params.id+'/'+req.params.id+'.'+extension,function(err){
				if(err){
				   res.send('Unable to delete file!');
				} 
				else{
				   sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+'.'+extension, function(err) {
					   if (err)
					   return res.status(500).send(err);
					   res.send('File uploaded!');
				   });
				}
		   }); 
		}
	});
});

//File Upload - New Client (Image and Signature)
users.post('/upload-file/:id/:item', function(req, res) {
    if (!req.files) return res.status(400).send('No files were uploaded.');
    if (!req.params) return res.status(400).send('No Number Plate specified!');
    let sampleFile = req.files.file,
        name = sampleFile.name,
        extArray = sampleFile.name.split("."),
        extension = extArray[extArray.length - 1],
        fileName = name+'.'+extension;

    fs.stat('files/users/'+req.params.id+'/', function(err) {
        if (!err) {
            console.log('file or directory exists');
        }
        else if (err.code === 'ENOENT') {
            fs.mkdirSync('files/users/'+req.params.id+'/');
        }
    });

    fs.stat('files/users/'+req.params.id+'/'+req.params.id+'_'+req.params.item+'.'+extension, function (err) {
        if (err) {
            sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+'_'+req.params.item+'.'+extension, function(err) {
                if (err) return res.status(500).send(err);
                res.send('File uploaded!');
            });
        }
        else{
            fs.unlink('files/users/'+req.params.id+'/'+req.params.id+'_'+req.params.item+'.'+extension,function(err){
                if(err){
                    res.send('Unable to delete file!');
                }
                else{
                    sampleFile.mv('files/users/'+req.params.id+'/'+req.params.id+'_'+req.params.item+'.'+extension, function(err) {
                        if (err)
                            return res.status(500).send(err);
                        res.send('File uploaded!');
                    });
                }
            });
        }
    });
});

/* GET users listing. */
users.get('/all-users', function(req, res, next) {
	let array = [],
        query = 'SELECT * from users where status = 1';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
          } else {
            async.forEach(results, function(k, cb){
                let path = 'files/users/'+k.username+'/';
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
                } else {
					k.image = "No Image";
					array.push(k);
					cb();
                }
                
            }, function(data){
				res.send(JSON.stringify({"status": 200, "error": null, "response": array}));
			});
	  	}
  	});
});

users.get('/users-list', function(req, res, next) {
    let query = 'SELECT *, (select u.role_name from user_roles u where u.ID = user_role) as Role from users where user_role not in (3, 4) and status = 1 order by ID desc';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
  			res.send(JSON.stringify(results));
	  	}
  	});
});

users.get('/teams-list', function(req, res, next) {
    let query = 'SELECT *, (select u.fullname from users u where u.ID = t.supervisor) as supervisor, (select count(*) from team_members m where m.teamID = t.ID and m.status = 1) as members, ' +
        '(select count(*) from user_targets m where m.userID = t.ID and m.status = 1) as targets from teams t where t.status = 1 order by t.ID desc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Teams fetched successfully", "response": results});
        }
    });
});

users.get('/team/members/:id', function(req, res, next) {
    let query = 'SELECT *,(select u.fullname from users u where u.ID = t.memberID) as member from team_members t where t.status = 1 and t.teamID = ? order by t.ID desc';
    db.query(query, [req.params.id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Team members fetched successfully", "response": results});
        }
    });
});

users.post('/team/members', function(req, res, next) {
    req.body.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('SELECT * FROM team_members WHERE teamID=? AND memberID=? AND status = 1', [req.body.teamID,req.body.memberID], function (error, result, fields) {
        if (result && result[0]) {
            res.send({"status": 500, "error": "User has already been assigned to this team"});
        } else {
            db.query('INSERT INTO team_members SET ?', req.body, function (error, result, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    db.query('SELECT *,(select u.fullname from users u where u.ID = t.memberID) as member from team_members t where t.status = 1 and t.teamID = ? order by t.ID desc', [req.body.teamID], function (error, results, fields) {
                        if(error){
                            res.send({"status": 500, "error": error, "response": null});
                        } else {
                            res.send({"status": 200, "message": "Team member assigned successfully", "response": results});
                        }
                    });
                }
            });
        }
    });
});

users.delete('/team/members/:id/:teamID', function(req, res, next) {
    let date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('UPDATE team_members SET status = 0, date_modified = ? WHERE ID = ?', [date, req.params.id], function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query('SELECT *,(select u.fullname from users u where u.ID = t.memberID) as member from team_members t where t.status = 1 and t.teamID = ? order by t.ID desc', [req.params.teamID], function (error, results, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "message": "Team member deleted successfully", "response": results});
                }
            });
        }
    });
});

users.get('/team/targets/:id', function(req, res, next) {
    let query = 'SELECT *,(select u.name from teams u where u.ID = t.userID) as user,(select u.name from sub_periods u where u.ID = t.sub_periodID) as period,' +
        '(select u.title from targets u where u.ID = t.targetID) as target from user_targets t where t.status = 1 and t.userID = ? order by t.ID desc';
    db.query(query, [req.params.id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Team targets fetched successfully", "response": results});
        }
    });
});

users.get('/user-targets/:id', function(req, res, next) {
    let query = 'SELECT *,(select u.fullname from users u where u.ID = t.userID) as user,(select u.name from sub_periods u where u.ID = t.sub_periodID) as period,' +
        '(select u.title from targets u where u.ID = t.targetID) as target from user_targets t where t.status = 1 and t.userID = ? order by t.ID desc';
    db.query(query, [req.params.id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User targets fetched successfully", "response": results});
        }
    });
});

users.get('/targets-list', function(req, res, next) {
    let type = req.query.type,
        target = req.query.target,
        sub_period = req.query.sub_period,
        query = 'SELECT *,(select u.name from teams u where u.ID = t.userID) as owner,(select u.name from sub_periods u where u.ID = t.sub_periodID) as period,' +
        '(select u.start from sub_periods u where u.ID = t.sub_periodID) as start,(select u.end from sub_periods u where u.ID = t.sub_periodID) as end,' +
        '(select u.title from targets u where u.ID = t.targetID) as target,(select u.type from targets u where u.ID = t.targetID) as type from user_targets t where t.status = 1 and t.user_type = "team"',
        query2 = 'SELECT *,(select u.fullname from users u where u.ID = t.userID) as owner,(select u.name from sub_periods u where u.ID = t.sub_periodID) as period,' +
            '(select u.start from sub_periods u where u.ID = t.sub_periodID) as start,(select u.end from sub_periods u where u.ID = t.sub_periodID) as end,' +
            '(select u.title from targets u where u.ID = t.targetID) as target,(select u.type from targets u where u.ID = t.targetID) as type from user_targets t where t.status = 1 and t.user_type = "user"';
    if (type){
        query = query.concat(' AND (select u.type from targets u where u.ID = t.targetID) = "'+type+'"');
        query2 = query2.concat(' AND (select u.type from targets u where u.ID = t.targetID) = "'+type+'"');
    }
    if (target){
        query = query.concat(' AND t.targetID = '+target);
        query2 = query2.concat(' AND t.targetID = '+target);
    }
    if (sub_period){
        query = query.concat(' AND t.sub_periodID = '+sub_period);
        query2 = query2.concat(' AND t.sub_periodID = '+sub_period);
    }
    db.query(query, function (error, team_targets, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query(query2, function (error, user_targets, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    results = team_targets.concat(user_targets);
                    res.send({"status": 200, "message": "Targets list fetched successfully", "response": results});
                }
            });
        }
    });
});

users.get('/committals/user/disbursement/:id', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end,
        query = 'SELECT count(*) count, sum(a.loan_amount) total FROM applications AS a, (SELECT ID client_id FROM clients WHERE loan_officer = ? AND status = 1) AS c WHERE a.userID = c.client_id AND a.status = 2',
        query2 = 'SELECT *, a.loan_amount amount, a.disbursement_channel channel, a.disbursement_date date, (SELECT cls.fullname FROM clients cls WHERE cls.ID = a.userID AND cls.status = 1) AS client FROM applications AS a, (SELECT ID client_id FROM clients WHERE loan_officer = ? AND status = 1) AS c WHERE a.userID = c.client_id AND a.status = 2';
    if (start && end){
        query = query.concat(' AND TIMESTAMP(a.disbursement_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
        query2 = query2.concat(' AND TIMESTAMP(a.disbursement_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
    }
    db.query(query, [req.params.id], function (error, aggregate, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query(query2, [req.params.id], function (error, list, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    let results = aggregate[0];
                    results.data = list;
                    res.send({"status": 200, "message": "Committals fetched successfully", "response": results});
                }
            });
        }
    });
});

users.get('/committals/user/interest/:id', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end,
        query = 'SELECT count(*) count, sum(s.interest_amount) total FROM schedule_history AS s, (SELECT ID application_id FROM applications AS a, (SELECT ID client_id FROM clients WHERE loan_officer = ? AND status = 1) AS c ' +
        'WHERE a.userID = c.client_id AND a.status = 2) AS apps WHERE s.applicationID = apps.application_id AND s.status = 1 AND s.interest_amount > 0',
        query2 = 'SELECT *, s.interest_amount amount, s.payment_source channel, s.payment_date date, (SELECT userID FROM applications WHERE ID = s.applicationID) AS userID, (SELECT fullname FROM clients where ID = userID) AS client ' +
            'FROM schedule_history AS s, (SELECT ID application_id, duration FROM applications AS a, (SELECT ID client_id FROM clients WHERE loan_officer = ? AND status = 1) AS c ' +
            'WHERE a.userID = c.client_id AND a.status = 2) AS apps WHERE s.applicationID = apps.application_id AND s.status = 1 AND s.interest_amount > 0';
    if (start && end){
        query = query.concat(' AND TIMESTAMP(s.payment_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
        query2 = query2.concat(' AND TIMESTAMP(s.payment_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
    }
    db.query(query, [req.params.id], function (error, aggregate, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query(query2, [req.params.id], function (error, list, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    let results = aggregate[0];
                    results.data = list;
                    res.send({"status": 200, "message": "Committals fetched successfully", "response": results});
                }
            });
        }
    });
});

users.get('/committals/team/disbursement/:id', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end,
        query = 'SELECT count(*) count, sum(a.loan_amount) total FROM applications AS a, (SELECT cl.ID client_id FROM clients AS cl, (SELECT memberID user_id FROM team_members WHERE teamID = ? AND status = 1) AS t ' +
        'WHERE cl.loan_officer = t.user_id AND cl.status = 1) AS c WHERE a.userID = c.client_id AND a.status = 2',
        query2 = 'SELECT *, a.loan_amount amount, a.disbursement_channel channel, a.disbursement_date date, (SELECT cls.fullname FROM clients cls WHERE cls.ID = a.userID AND cls.status = 1) AS client FROM applications AS a, (SELECT cl.ID client_id FROM clients AS cl, (SELECT memberID user_id FROM team_members WHERE teamID = ? AND status = 1) AS t WHERE cl.loan_officer = t.user_id AND cl.status = 1) AS c ' +
            'WHERE a.userID = c.client_id AND a.status = 2';
    if (start && end){
        query = query.concat(' AND TIMESTAMP(a.disbursement_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
        query2 = query2.concat(' AND TIMESTAMP(a.disbursement_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
    }
    db.query(query, [req.params.id], function (error, aggregate, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query(query2, [req.params.id], function (error, list, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    let results = aggregate[0];
                    results.data = list;
                    res.send({"status": 200, "message": "Committals fetched successfully", "response": results});
                }
            });
        }
    });
});

users.get('/committals/team/interest/:id', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end,
        query = 'SELECT count(*) count, sum(s.interest_amount) total FROM schedule_history AS s, (SELECT ID application_id FROM applications AS a, (SELECT cl.ID client_id FROM clients AS cl, (SELECT memberID user_id FROM team_members WHERE teamID = ? AND status = 1) AS t WHERE cl.loan_officer = t.user_id AND cl.status = 1) AS c WHERE a.userID = c.client_id AND a.status = 2) AS apps ' +
        'WHERE s.applicationID = apps.application_id AND s.status = 1 AND s.interest_amount > 0',
        query2 = 'SELECT *, s.interest_amount amount, s.payment_source channel, s.payment_date date, (SELECT userID FROM applications WHERE ID = s.applicationID) AS userID, (SELECT fullname FROM clients where ID = userID) AS client ' +
            'FROM schedule_history AS s, (SELECT ID application_id, duration FROM applications AS a, (SELECT cl.ID client_id FROM clients AS cl, (SELECT memberID user_id FROM team_members WHERE teamID = 1 AND status = 1) AS t WHERE cl.loan_officer = t.user_id AND cl.status = 1) AS c WHERE a.userID = c.client_id AND a.status = 2) AS apps ' +
            'WHERE s.applicationID = apps.application_id AND s.status = 1 AND s.interest_amount > 0';
    if (start && end){
        query = query.concat(' AND TIMESTAMP(s.payment_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
        query2 = query2.concat(' AND TIMESTAMP(s.payment_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
    }
    db.query(query, [req.params.id], function (error, aggregate, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query(query2, [req.params.id], function (error, list, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    let results = aggregate[0];
                    results.data = list;
                    res.send({"status": 200, "message": "Committals fetched successfully", "response": results});
                }
            });
        }
    });
});

users.get('/committals/disbursement/:id', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end,
        query = 'SELECT count(*) count, sum(a.loan_amount) total FROM applications AS a, (SELECT cl.ID client_id FROM clients AS cl, (SELECT ID user_id FROM users WHERE loan_officer_status = 1 AND status = 1) AS t WHERE cl.loan_officer = t.user_id AND cl.status = 1) AS c ' +
        'WHERE a.userID = c.client_id AND a.status = 2',
        query2 = 'SELECT *, a.loan_amount amount, a.disbursement_channel channel, a.disbursement_date date, (SELECT cls.fullname FROM clients cls WHERE cls.ID = a.userID AND cls.status = 1) AS client FROM applications AS a, ' +
            '(SELECT cl.ID client_id FROM clients AS cl, (SELECT ID user_id FROM users WHERE loan_officer_status = 1 AND status = 1) AS t WHERE cl.loan_officer = t.user_id AND cl.status = 1) AS c ' +
            'WHERE a.userID = c.client_id AND a.status = 2';
    if (start && end){
        query = query.concat(' AND TIMESTAMP(a.disbursement_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
        query2 = query2.concat(' AND TIMESTAMP(a.disbursement_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
    }
    db.query(query, [req.params.id], function (error, aggregate, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query(query2, [req.params.id], function (error, list, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    let results = aggregate[0];
                    results.data = list;
                    res.send({"status": 200, "message": "Committals fetched successfully", "response": results});
                }
            });
        }
    });
});

users.get('/committals/interest/:id', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end,
        query = 'SELECT count(*) count, sum(s.interest_amount) total FROM schedule_history AS s, (SELECT ID application_id FROM applications AS a, (SELECT cl.ID client_id FROM clients AS cl, (SELECT ID user_id FROM users WHERE loan_officer_status = 1 AND status = 1) AS t WHERE cl.loan_officer = t.user_id AND cl.status = 1) AS c WHERE a.userID = c.client_id AND a.status = 2) AS apps ' +
        'WHERE s.applicationID = apps.application_id AND s.status = 1 AND s.interest_amount > 0',
        query2 = 'SELECT *, s.interest_amount amount, s.payment_source channel, s.payment_date date, (SELECT userID FROM applications WHERE ID = s.applicationID) AS userID, (SELECT fullname FROM clients where ID = userID) AS client ' +
            'FROM schedule_history AS s, (SELECT ID application_id, duration FROM applications AS a, (SELECT cl.ID client_id FROM clients AS cl, (SELECT ID user_id FROM users WHERE loan_officer_status = 1 AND status = 1) AS t WHERE cl.loan_officer = t.user_id AND cl.status = 1) AS c WHERE a.userID = c.client_id AND a.status = 2) AS apps ' +
            'WHERE s.applicationID = apps.application_id AND s.status = 1 AND s.interest_amount > 0';
    if (start && end){
        query = query.concat(' AND TIMESTAMP(s.payment_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
        query2 = query2.concat(' AND TIMESTAMP(s.payment_date) BETWEEN TIMESTAMP("'+start+'") AND TIMESTAMP("'+end+'")');
    }
    db.query(query, [req.params.id], function (error, aggregate, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query(query2, [req.params.id], function (error, list, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    let results = aggregate[0];
                    results.data = list;
                    res.send({"status": 200, "message": "Committals fetched successfully", "response": results});
                }
            });
        }
    });
});

users.get('/target/details/:id', function(req, res, next) {
    let query = 'SELECT count(*) count, sum(t.value) total FROM user_targets AS t WHERE targetID = ? AND status = 1',
        query2 = 'SELECT *, (SELECT name FROM sub_periods WHERE ID = t.sub_periodID) AS period, (CASE WHEN t.user_type = "user" THEN (SELECT fullname FROM users WHERE ID = userID) WHEN t.user_type = "team" THEN (SELECT name FROM teams WHERE ID = userID) END) AS owner ' +
            'FROM user_targets AS t WHERE t.targetID = ? AND t.status = 1';
    db.query(query, [req.params.id], function (error, aggregate, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query(query2, [req.params.id], function (error, list, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    let results = aggregate[0];
                    results.data = list;
                    res.send({"status": 200, "message": "Target details fetched successfully", "response": results});
                }
            });
        }
    });
});

users.get('/target/limit/:id', function(req, res, next) {
    let query = 'SELECT sum(t.value) allocated, (SELECT value FROM targets WHERE ID = t.targetID) target, ' +
        '((SELECT value FROM targets WHERE ID = t.targetID) - sum(t.value)) unallocated FROM user_targets AS t WHERE targetID = ? AND status = 1';
    db.query(query, [req.params.id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Target limit fetched successfully", "response": results[0]});
        }
    });
});

users.post('/team/targets', function(req, res, next) {
    req.body.user_type = "team";
    req.body.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('SELECT * FROM user_targets WHERE userID=? AND sub_periodID=? AND status = 1', [req.body.userID,req.body.sub_periodID], function (error, result, fields) {
        if (result && result[0]) {
            res.send({"status": 500, "error": "Target has already been assigned to this team"});
        } else {
            db.query('SELECT * FROM targets WHERE ID=?', [req.body.targetID], function (error, target, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    req.body.periodID = target[0]['period'];
                    db.query('INSERT INTO user_targets SET ?', req.body, function (error, result, fields) {
                        if(error){
                            res.send({"status": 500, "error": error, "response": null});
                        } else {
                            let query = 'SELECT *,(select u.name from teams u where u.ID = t.userID) as user,(select u.name from sub_periods u where u.ID = t.sub_periodID) as period,' +
                                '(select u.title from targets u where u.ID = t.targetID) as target from user_targets t where t.status = 1 and t.userID = ? order by t.ID desc';
                            db.query(query, [req.body.userID], function (error, results, fields) {
                                if(error){
                                    res.send({"status": 500, "error": error, "response": null});
                                } else {
                                    res.send({"status": 200, "message": "Team target assigned successfully", "response": results});
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

users.post('/user-targets', function(req, res, next) {
    req.body.user_type = "user";
    req.body.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('SELECT * FROM user_targets WHERE userID=? AND sub_periodID=? AND status = 1', [req.body.userID,req.body.sub_periodID], function (error, result, fields) {
        if (result && result[0]) {
            res.send({"status": 500, "error": "Target has already been assigned to this user"});
        } else {
            db.query('SELECT * FROM users WHERE ID=?', [req.body.userID], function (error, user, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    if (user[0]['loan_officer_status'] !== 1)
                        return res.send({"status": 500, "error": "User must be a loan officer"});
                    db.query('SELECT * FROM targets WHERE ID=?', [req.body.targetID], function (error, target, fields) {
                        if(error){
                            res.send({"status": 500, "error": error, "response": null});
                        } else {
                            req.body.periodID = target[0]['period'];
                            db.query('INSERT INTO user_targets SET ?', req.body, function (error, result, fields) {
                                if(error){
                                    res.send({"status": 500, "error": error, "response": null});
                                } else {
                                    let query = 'SELECT *,(select u.fullname from users u where u.ID = t.userID) as user,(select u.name from sub_periods u where u.ID = t.sub_periodID) as period,' +
                                        '(select u.title from targets u where u.ID = t.targetID) as target from user_targets t where t.status = 1 and t.userID = ? order by t.ID desc';
                                    db.query(query, [req.body.userID], function (error, results, fields) {
                                        if(error){
                                            res.send({"status": 500, "error": error, "response": null});
                                        } else {
                                            res.send({"status": 200, "message": "User target assigned successfully", "response": results});
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

users.delete('/team/targets/:id/:userID', function(req, res, next) {
    let date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('UPDATE user_targets SET status = 0, date_modified = ? WHERE ID = ?', [date, req.params.id], function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let query = 'SELECT *,(select u.name from teams u where u.ID = t.userID) as user,(select u.name from sub_periods u where u.ID = t.sub_periodID) as period,' +
                '(select u.title from targets u where u.ID = t.targetID) as target from user_targets t where t.status = 1 and t.userID = ? order by t.ID desc';
            db.query(query, [req.params.userID], function (error, results, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "message": "Team target deleted successfully", "response": results});
                }
            });
        }
    });
});

users.delete('/user-targets/:id/:userID', function(req, res, next) {
    let date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('UPDATE user_targets SET status = 0, date_modified = ? WHERE ID = ?', [date, req.params.id], function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let query = 'SELECT *,(select u.fullname from users u where u.ID = t.userID) as user,(select u.name from sub_periods u where u.ID = t.sub_periodID) as period,' +
                '(select u.title from targets u where u.ID = t.targetID) as target from user_targets t where t.status = 1 and t.userID = ? order by t.ID desc';
            db.query(query, [req.params.userID], function (error, results, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "message": "User target deleted successfully", "response": results});
                }
            });
        }
    });
});

users.get('/users-list-full', function(req, res, next) {
    let query = 'SELECT *, (select u.fullname from users u where u.ID = s.supervisor) as supervisor, (select u.role_name from user_roles u where u.ID = s.user_role) as Role ' +
        'from users s where s.user_role not in (3, 4) order by s.ID desc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

users.get('/branches', function(req, res, next) {
    let query = 'SELECT * from branches';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

users.get('/states', function(req, res, next) {
    let query = 'SELECT * from state';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

users.get('/countries', function(req, res, next) {
    let query = 'SELECT * from country';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

users.get('/clients-list', function(req, res, next) {
    let query = 'select * from clients where status = 1';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

users.get('/clients-list-full', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end,
        loan_officer = req.query.officer
    let query = 'select * from clients ';
    if (start && end){
        console.log("Here");
        start = "'"+moment(start).utcOffset('+0100').format("YYYY-MM-DD")+"'"
        end = "'"+moment(end).add(1, 'days').format("YYYY-MM-DD")+"'"
        query = query.concat('where TIMESTAMP(date_created) between TIMESTAMP('+start+') and TIMESTAMP('+end+')')
    }
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

users.get('/users-list-v2', function(req, res, next) {
    let query = 'SELECT * from clients where status = 1 order by fullname asc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

users.get('/user-dets/:id', function(req, res, next) {
    let query = 'SELECT *, (select u.role_name from user_roles u where u.ID = user_role) as Role from users where id = ? order by ID desc ';
	db.query(query, req.params.id, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
            res.send(results);
	  	}
  	});
});

users.get('/client-dets/:id', function(req, res, next) {
    let query = 'SELECT *, (select fullname from users u where u.ID = clients.loan_officer) as officer, (select branch_name from branches b where b.ID = clients.branch) as branchname, (SELECT SUM(amount) FROM escrow WHERE clientID=clients.ID AND status=1) AS escrow   from clients where id = ? order by id desc ';
    db.query(query, req.params.id, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(results);
        }
    });
});

users.get('/user-roles', function(req, res, next) {
    let query = 'SELECT * from user_roles where status = 1 and id not in (1, 3, 4)';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
  			res.send(JSON.stringify(results));
	  	}
  	});
});

users.get('/roles/', function(req, res, next) {
    let query = (req.params.role === '1') ? 'SELECT * from user_roles where id not in (3, 4, 1) ' : 'SELECT * from user_roles where id not in (3, 4) ';
    db.query(query, req.params.role, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

/* GET users count. */
users.get('/usersCount', function(req, res, next) {
    let query = 'SELECT count(*) as total from users where status = 1';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
  			res.send(JSON.stringify(results));
	  	}
  	});
});

/* GET All Requests count. */
users.get('/all-requests', function(req, res, next) {
    let query = 'select count(*) as requests from requests, clients where clients.ID = requests.userID AND requests.status <> 0';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(results);
        }
    });
});

/* GET All Applications count. */
users.get('/all-applications', function(req, res, next) {
    let query = 'select count(*) as applications from applications where applications.status = 1';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(results);
        }
    });
});

/* GET Specific User. */
users.get('/user/:id', function(req, res, next) {
    let path = 'files/users/'+req.params.id+'/',
        query = 'SELECT * from users where username = ?';
	db.query(query, [req.params.id], function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
            fs.stat(path, function(err) {
				if (!err){
					let obj = {},
                        items = [],
                        image = "";
					fs.readdir(path, function (err, files){
						files.forEach(function (file){
							image = path+file;
						});
						res.send(JSON.stringify({"status": 200, "error": null, "response": results, "image": image}));
					});
				}else{
				    res.send(JSON.stringify({"status": 200, "error": null, "response": results, "path": "No Image Uploaded Yet"}));
				}
			});
	  	}
  	});
});

/* Edit User Info */
users.post('/edit-user/:id', function(req, res, next) {
	let date = Date.now(),
        postData = req.body;
	postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.fullname, postData.user_role, postData.email, postData.branch, postData.supervisor, postData.loan_officer_status, postData.date_modified, req.params.id],
        query = 'Update users SET fullname=?, user_role=?, email=?, branch =?, supervisor =?, loan_officer_status =?, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "User Details Updated"}));
	  	}
  	});
});

users.post('/edit-client/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.username, postData.fullname, postData.phone, postData.address, postData.email,
    postData.gender, postData.dob, postData.marital_status, postData.loan_officer, postData.branch , postData.client_state, postData.postcode, postData.client_country,
    postData.years_add, postData.ownership , postData.employer_name ,postData.industry ,postData.job, postData.job_country , postData.off_address, postData.off_state,
    postData.doe, postData.guarantor_name, postData.guarantor_occupation, postData.relationship, postData.years_known, postData.guarantor_phone, postData.guarantor_email,
    postData.guarantor_address, postData.gua_country, postData.date_modified, req.params.id];
    let query = 'Update clients SET username = ?, fullname=?, phone=?, address = ?, email=?, gender=?, dob = ?, marital_status=?, loan_officer=?, branch=?, ' +
                'client_state=?, postcode=?, client_country=?, years_add=?, ownership=?, employer_name=?, industry=?, job=?, job_country=?, off_address=?, off_state=?, ' +
                'doe=?, guarantor_name=?, guarantor_occupation=?, relationship=?, years_known=?, guarantor_phone=?, guarantor_email=?, guarantor_address=?, gua_country=?, ' +
                'date_modified = ? where ID=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "User Details Updated"}));
        }
    });
});

/* Change Branch Status */
users.post('/del-branch/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update branches SET status = 0, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Branch Disabled!"}));
        }
    });
});

/* Reactivate Branch */
users.post('/en-branch/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update branches SET status = 1, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Branch Re-enabled!"}));
        }
    });
});

/* Change Role Status */
users.post('/del-role/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update user_roles SET status = 0, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Role Disabled!"}));
        }
    });
});

/* Reactivate Role */
users.post('/en-role/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update user_roles SET status = 1, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Role Re-enabled!"}));
        }
    });
});

// Disable User
users.post('/del-user/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update users SET status = 0, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "User Disabled!"}));
        }
    });
});

// Enable User
users.post('/en-user/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update users SET status = 1, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "User Reactivated!"}));
        }
    });
});

// Change Client Status
users.post('/del-client/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update clients SET status = 0, date_modified = ? where ID=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Client Disabled!"}));
        }
    });
});

// Enable Client
users.post('/en-client/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update clients SET status = 1, date_modified = ? where ID=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Client Reactivated!"}));
        }
    });
});

/* Change User Password */
users.post('/changePassword/:id', function(req, res, next) {
    let date_modified = Date.now(),
        query = 'Update users SET password = ?, date_modified = ?  where id=?';
    db.query(query, [bcrypt.hashSync(req.body.password, parseInt(process.env.SALT_ROUNDS)), date_modified, req.params.id], function (error, results, fields) {                   ;
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
  			res.send({"status": 200, "error": null, "response": results, "message": "User password updated!"});
	  	}
  	});
});

/* GET Vehicle Owners listing. */
users.get('/owners/', function(req, res, next) {
    let query = 'SELECT * from users where user_role = 4';
	db.query(query, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
			res.send(JSON.stringify(results));
	  	}
  	});
});

/* Add New Vehicle Owner*/
users.post('/new-owner', function(req, res, next) {
    let postData = req.body;
    postData.date_created = Date.now();
    let query =  'INSERT INTO vehicle_owners Set ?';
	db.query(query,postData, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "New Vehicle Owner Added!"}));
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
    if (!workflow_id)
        query =  'INSERT INTO requests Set ?';
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
                from: 'no-reply Loanratus <applications@loan35.com>',
                to: req.body.email,
                subject: 'Loanratus Application Successful',
                template: 'main',
                context: data
            };
            transporter.sendMail(mailOptions, function(error, info){
                if(error)
                    console.log({"status": 500, "message": "Error occurred!", "response": error});
                if (!workflow_id)
                    return res.send({"status": 200, "message": "New Application Added!"});
                getNextWorkflowProcess(false,workflow_id,false, function (process) {
                    db.query('SELECT MAX(ID) AS ID from applications', function(err, application, fields) {
                        process.workflowID = workflow_id;
                        process.agentID = postData.agentID;
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
    if (!data.name || !data.email || !data.company || !data.phone || !data.title || !data.location || !data.description || !data.lead)
        return res.send("Required Parameters not sent!");
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
        'a.workflowID, a.loan_amount, a.date_modified, a.comment, a.close_status, w.current_stage FROM clients AS u, applications AS a, workflow_processes AS w WHERE u.ID=a.userID AND a.status <> 0 ' +
        'AND w.ID = (SELECT MAX(ID) FROM workflow_processes WHERE applicationID=a.ID AND status=1) ORDER BY a.ID desc';
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
        'a.loan_amount, a.date_modified, a.comment FROM clients AS u, requests AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

//Get A User's Applications For Profile Page
users.get('/user-applications/:id', function(req, res, next) {
    let query = 'SELECT * FROM applications WHERE userid = ? AND interest_rate <> 0 ORDER BY id desc';
    db.query(query, req.params.id, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send(results);
        }
    });
});

users.get('/application/:id', function(req, res, next) {
    let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
        'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM clients AS u, applications AS a WHERE u.ID=a.userID AND u.ID =?';
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
        query = 'SELECT u.ID AS userID, u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
            'a.workflowID, a.reschedule_amount, a.loanCirrusID, a.loan_amount, a.date_modified, a.comment, a.close_status, (SELECT SUM(amount) FROM escrow WHERE clientID=u.ID AND status=1) AS escrow ' +
            'FROM clients AS u, applications AS a WHERE u.ID=a.userID AND a.ID =?';
    db.getConnection(function(err, connection) {
        if (err) throw err;

        connection.query(query, [application_id], function (error, result, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                result = (result[0])? result[0] : {};
                if (!fs.existsSync(path)){
                    result.files = {};
                    connection.query('SELECT * FROM application_schedules WHERE applicationID=?', [application_id], function (error, schedule, fields) {
                        if (error) {
                            res.send({"status": 500, "error": error, "response": null});
                        } else {
                            result.schedule = schedule;
                            connection.query('SELECT * FROM schedule_history WHERE applicationID=? AND status=1 ORDER BY ID desc', [application_id], function (error, payment_history, fields) {
                                connection.release();
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
                            connection.query('SELECT * FROM application_schedules WHERE applicationID=?', [application_id], function (error, schedule, fields) {
                                if (error) {
                                    res.send({"status": 500, "error": error, "response": null});
                                } else {
                                    result.schedule = schedule;
                                    connection.query('SELECT * FROM schedule_history WHERE applicationID=? AND status=1 ORDER BY ID desc', [application_id], function (error, payment_history, fields) {
                                        connection.release();
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
});

/* GET User Applications. */
users.get('/applications/filter', function(req, res, next) {
    let start = req.query.start,
		end = req.query.end,
		type = req.query.type;
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");

	let query = "SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, " +
        "a.loan_amount, a.date_modified, a.comment, a.close_status, a.workflowID, w.current_stage FROM clients AS u, applications AS a, workflow_processes AS w " +
        "WHERE u.ID=a.userID AND a.status <> 0 AND w.ID = (SELECT MAX(ID) FROM workflow_processes WHERE applicationID=a.ID AND status=1) ";
    if (type){
	    switch (type){
            case '1': {
                //do nothing
                break;
            }
            case '2': {
                query = query.concat("AND a.status = 1 AND a.close_status = 0 AND w.current_stage<>2  AND w.current_stage<>3 ");
                break;
            }
            case '3': {
                query = query.concat("AND a.status = 1 AND a.close_status = 0 AND w.current_stage=2 ");
                break;
            }
            case '4': {
                query = query.concat("AND a.status = 1 AND a.close_status = 0 AND w.current_stage=3 ");
                break;
            }
            case '5': {
                query = query.concat("AND a.status = 2  AND a.close_status = 0 ");
                break;
            }
            case '6': {
                query = query.concat("AND a.close_status <> 0 ");
                break;
            }
        }
    }
    if (start && end)
        query = query.concat("AND TIMESTAMP(a.date_created) < TIMESTAMP('"+end+"') AND TIMESTAMP(a.date_created) >= TIMESTAMP('"+start+"') ");
    query = query.concat("ORDER BY a.ID desc");
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "User applications fetched successfully!", "response": results});
        }
    });
});

users.get('/collections/filter', function(req, res, next) {
    let type = req.query.type,
        range = parseInt(req.query.range),
        today = moment().utcOffset('+0100').format('YYYY-MM-DD');

    let query = "SELECT s.ID, (select fullname from clients c where c.ID = (select userID from applications a where a.ID = s.applicationID)) AS client, " +
        "s.applicationID, s.status, s.payment_amount, s.payment_collect_date, s.payment_status, 'Principal' AS 'type' FROM application_schedules AS s " +
        "WHERE s.status = 1 AND s.payment_status = 0 AND (select status from applications a where a.ID = s.applicationID) = 2 " +
        "AND (select close_status from applications a where a.ID = s.applicationID) = 0 ";

    collectionsQueryMiddleware(query, type, range, today, function (response) {
        if (response.status !== 200)
            return res.send(response);
        let query = "SELECT s.ID, (select fullname from clients c where c.ID = (select userID from applications a where a.ID = s.applicationID)) AS client, " +
            "s.applicationID, s.status, s.interest_amount as payment_amount, s.interest_collect_date as payment_collect_date, s.payment_status, 'Interest' AS 'type' FROM application_schedules AS s " +
            "WHERE s.status = 1 AND s.payment_status = 0 AND (select status from applications a where a.ID = s.applicationID) = 2 " +
            "AND (select close_status from applications a where a.ID = s.applicationID) = 0 ",
            results_principal = response.response;
        collectionsQueryMiddleware(query, type, range, today, function (response) {
            if (response.status !== 200)
                return res.send(response);
            let results_interest = response.response,
                results = results_principal.concat(results_interest);
            return res.send({"status": 200, "message": "Collections fetched successfully!", "response": results});
        });
    });
});

function collectionsQueryMiddleware(query, type, range, today, callback) {
    switch (type){
        case 'due': {
            query = query.concat(collectionDueRangeQuery(today, range));
            break;
        }
        case 'overdue': {
            query = query.concat(collectionOverdueRangeQuery(today, range));
            break;
        }
    }
    query = query.concat(" ORDER BY ID desc");
    db.query(query, function (error, results, fields) {
        if(error){
            callback({"status": 500, "error": error, "response": null});
        } else {
            callback({"status": 200, "response": results});
        }
    });
}

function collectionDueRangeQuery(today, range){
    switch (range){
        case 0: {
            return 'AND TIMESTAMP(payment_collect_date) = TIMESTAMP("'+today+'") ';
        }
        case 1: {
            return 'AND TIMESTAMP(payment_collect_date) = TIMESTAMP("'+moment(today).add(1, "days").format("YYYY-MM-DD")+'") ';
        }
        case 7: {
            return 'AND TIMESTAMP(payment_collect_date) >= TIMESTAMP("'+moment(today).add(2, "days").format("YYYY-MM-DD")+'") ' +
                'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).add(7, "days").format("YYYY-MM-DD")+'") ';
        }
        case 14: {
            return 'AND TIMESTAMP(payment_collect_date) >= TIMESTAMP("'+moment(today).add(8, "days").format("YYYY-MM-DD")+'") ' +
                'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).add(14, "days").format("YYYY-MM-DD")+'") ';
        }
        case 30: {
            return 'AND TIMESTAMP(payment_collect_date) >= TIMESTAMP("'+moment(today).add(15, "days").format("YYYY-MM-DD")+'") ' +
                'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).add(30, "days").format("YYYY-MM-DD")+'") ';
        }
        case 60: {
            return 'AND TIMESTAMP(payment_collect_date) >= TIMESTAMP("'+moment(today).add(31, "days").format("YYYY-MM-DD")+'") ' +
                'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).add(60, "days").format("YYYY-MM-DD")+'") ';
        }
        case 61: {
            return 'AND TIMESTAMP(payment_collect_date) > TIMESTAMP("'+moment(today).add(60, "days").format("YYYY-MM-DD")+'") ';
        }
    }
}

function collectionOverdueRangeQuery(today, range){
    switch (range){
        case 0: {
            return 'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).subtract(1, "days").format("YYYY-MM-DD")+'") ';
        }
        case 1: {
            return 'AND TIMESTAMP(payment_collect_date) = TIMESTAMP("'+moment(today).subtract(1, "days").format("YYYY-MM-DD")+'") ';
        }
        case 7: {
            return 'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).subtract(2, "days").format("YYYY-MM-DD")+'") ' +
                'AND TIMESTAMP(payment_collect_date) >= TIMESTAMP("'+moment(today).subtract(7, "days").format("YYYY-MM-DD")+'") ';
        }
        case 14: {
            return 'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).subtract(8, "days").format("YYYY-MM-DD")+'") ' +
                'AND TIMESTAMP(payment_collect_date) >= TIMESTAMP("'+moment(today).subtract(14, "days").format("YYYY-MM-DD")+'") ';
        }
        case 30: {
            return 'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).subtract(15, "days").format("YYYY-MM-DD")+'") ' +
                'AND TIMESTAMP(payment_collect_date) >= TIMESTAMP("'+moment(today).subtract(30, "days").format("YYYY-MM-DD")+'") ';
        }
        case 60: {
            return 'AND TIMESTAMP(payment_collect_date) <= TIMESTAMP("'+moment(today).subtract(31, "days").format("YYYY-MM-DD")+'") ' +
                'AND TIMESTAMP(payment_collect_date) >= TIMESTAMP("'+moment(today).subtract(60, "days").format("YYYY-MM-DD")+'") ';
        }
        case 61: {
            return 'AND TIMESTAMP(payment_collect_date) < TIMESTAMP("'+moment(today).subtract(60, "days").format("YYYY-MM-DD")+'") ';
        }
    }
}

users.get('/requests/filter/:start/:end', function(req, res, next) {
    let start = req.params.start,
        end = req.params.end;
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let query = "SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, " +
        "a.loan_amount, a.date_modified, a.comment FROM clients AS u, requests AS a WHERE u.ID=a.userID AND a.status <> 0 " +
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
                'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM clients AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
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
        query =  'UPDATE requests SET status=0, date_modified=? where ID=?';
    db.query(query,[date_modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                'a.loan_amount, a.date_modified, a.comment FROM clients AS u, requests AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
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
                'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM clients AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
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
        query =  'UPDATE requests SET comment=?, date_modified=? where ID=?';
    db.query(query,[comment, date_modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                'a.loan_amount, a.date_modified, a.comment FROM clients AS u, requests AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
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

users.get('/application/assign_workflow/:id/:workflow_id/:agent_id', function(req, res, next) {
    let id = req.params.id,
        agent_id = req.params.agent_id,
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
                process.agentID = agent_id;
                process.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
                db.query('INSERT INTO workflow_processes SET ?',process, function (error, results, fields) {
                    if(error){
                        res.send({"status": 500, "error": error, "response": null});
                    } else {
                        let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
                            'a.workflowID, a.loan_amount, a.date_modified, a.comment FROM clients AS u, applications AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
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

// users.get('/request/assign_workflow/:id/:workflow_id', function(req, res, next) {
//     let id = req.params.id,
//         workflow_id = req.params.workflow_id,
//         date_modified = Date.now(),
//         query =  'UPDATE requests SET workflowID=?, date_modified=? where ID=?';
//     db.query(query,[workflow_id, date_modified, id], function (error, results, fields) {
//         if(error){
//             res.send({"status": 500, "error": error, "response": null});
//         } else {
//             getNextWorkflowProcess(false,workflow_id,false, function (process) {
//                 process.workflowID = workflow_id;
//                 process.applicationID = id;
//                 process.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
//                 db.query('INSERT INTO workflow_processes SET ?',process, function (error, results, fields) {
//                     if(error){
//                         res.send({"status": 500, "error": error, "response": null});
//                     } else {
//                         let query = 'SELECT u.fullname, u.phone, u.email, u.address, a.ID, a.status, a.collateral, a.brand, a.model, a.year, a.jewelry, a.date_created, ' +
//                             'a.loan_amount, a.date_modified, a.comment FROM clients AS u, requests AS a WHERE u.ID=a.userID AND a.status <> 0 ORDER BY a.ID desc';
//                         db.query(query, function (error, results, fields) {
//                             if(error){
//                                 res.send({"status": 500, "error": error, "response": null});
//                             } else {
//                                 res.send({"status": 200, "message": "Workflow assigned successfully!", "response": results});
//                             }
//                         });
//                     }
//                 });
//             });
//         }
//     });
// });

users.post('/workflow_process/:application_id/:workflow_id', function(req, res, next) {
    let stage = req.body.stage,
        agent_id = req.body.agentID,
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
        process.agentID = agent_id;
        process.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
        db.query('SELECT * FROM workflow_processes WHERE ID = (SELECT MAX(ID) FROM workflow_processes WHERE applicationID=? AND status=1)', [application_id], function (error, last_process, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                db.query('UPDATE workflow_processes SET approval_status=? WHERE ID=? AND status=1',[1,last_process[0]['ID']], function (error, status, fields) {
                    if(error){
                        res.send({"status": 500, "error": error, "response": null});
                    } else {
                        if (!(((process.approver_id).split(',')).includes((user_role).toString())))
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
    let query = 'SELECT w.ID, w.workflowID, w.previous_stage, w.current_stage, w.next_stage, w.approval_status, w.date_created, w.applicationID, w.status,' +
        'w.agentID, u.fullname AS agent FROM workflow_processes AS w, users AS u WHERE applicationID = ? AND w.agentID = u.ID';
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
            stages.push({name:"Denied",stageID:4,stage_name:"Denied",workflowID:workflow_id,approverID:1});
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
                let previous_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(stage['previous_stage'])),
                    current_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(stage['current_stage'])),
                    next_stage_index = current_stage_index+1;
                if (stage['next_stage']){
                    callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stage['next_stage'], approver_id:stages[previous_stage_index]['approverID']});
                }else if (stages[next_stage_index]){
                    if (stage['current_stage'] !== stages[next_stage_index]['stageID']){
                        callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stages[next_stage_index]['stageID'], approver_id:stages[previous_stage_index]['approverID']});
                    } else {
                        if (stages[next_stage_index+1]){
                            callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stages[next_stage_index+1]['stageID'], approver_id:stages[previous_stage_index]['approverID']});
                        } else {
                            callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'], approver_id:stages[previous_stage_index]['approverID']});
                        }
                    }
                } else {
                    callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'], approver_id:stages[previous_stage_index]['approverID']});
                }
            } else {
                callback({current_stage:stages[0]['stageID'],next_stage:stages[1]['stageID']});
            }
        } else {
            callback({})
        }
    });
}

users.post('/application/comments/:id/:user_id', function(req, res, next) {
    db.query('SELECT * FROM applications WHERE ID = ?', [req.params.id], function (error, application, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query('INSERT INTO application_comments SET ?', [{applicationID:req.params.id,userID:req.params.user_id,text:req.body.text,date_created:moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a')}],
                function (error, response, fields) {
                    if(error || !response)
                        res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
                    db.query('SELECT c.text, c.date_created, u.fullname FROM application_comments AS c, users AS u WHERE c.applicationID = ? AND c.userID=u.ID ORDER BY c.ID desc', [req.params.id], function (error, comments, fields) {
                        if(error){
                            res.send({"status": 500, "error": error, "response": null});
                        } else {
                            res.send({"status": 200, "message": "Application commented successfully!", "response": comments});
                        }
                    });
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
    db.getConnection(function(err, connection) {
        if (err) throw err;

        connection.query('SELECT * FROM application_schedules WHERE applicationID = ? AND status = 1', [req.params.id], function (error, invoices, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                async.forEach(invoices, function (invoice, callback) {
                    connection.query('UPDATE application_schedules SET status=0 WHERE ID = ?', [invoice.ID], function (error, response, fields) {
                        callback();
                    });
                }, function (data) {
                    let count = 0;
                    async.forEach(req.body.schedule, function (obj, callback2) {
                        obj.applicationID = req.params.id;
                        connection.query('INSERT INTO application_schedules SET ?', obj, function (error, response, fields) {
                            if(!error)
                                count++;
                            callback2();
                        });
                    }, function (data) {
                        connection.release();
                        res.send({"status": 200, "message": "Application scheduled with "+count+" invoices successfully!", "response": null});
                    });
                });
            }
        });
    });
});

users.post('/application/approve-schedule/:id', function(req, res, next) {
    db.getConnection(function(err, connection) {
        if (err) throw err;
        let reschedule_amount = req.body.reschedule_amount,
            loan_amount_update = req.body.loan_amount_update,
            date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
        connection.query('UPDATE applications SET loan_amount = ?, reschedule_amount = ?, date_modified = ? WHERE ID = ?', [loan_amount_update,reschedule_amount,date_modified,req.params.id], function (error, invoice, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                connection.query('SELECT * FROM application_schedules WHERE applicationID = ? AND status = 1', [req.params.id], function (error, invoices, fields) {
                    if(error){
                        res.send({"status": 500, "error": error, "response": null});
                    } else {
                        async.forEach(invoices, function (invoice, callback) {
                            connection.query('UPDATE application_schedules SET status=0 WHERE ID = ?', [invoice.ID], function (error, response, fields) {
                                callback();
                            });
                        }, function (data) {
                            connection.query('SELECT * FROM application_schedules WHERE applicationID = ? AND status = 2', [req.params.id], function (error, new_schedule, fields) {
                                if (error) {
                                    res.send({"status": 500, "error": error, "response": null});
                                } else {
                                    let count = 0;
                                    async.forEach(new_schedule, function (obj, callback2) {
                                        connection.query('UPDATE application_schedules SET status=1, date_modified=? WHERE ID = ?', [date_modified,obj.ID], function (error, response, fields) {
                                            if(!error)
                                                count++;
                                            callback2();
                                        });
                                    }, function (data) {
                                        connection.release();
                                        res.send({"status": 200, "message": "Application schedule approved with "+count+" invoices successfully!", "response": null});
                                    });
                                }
                            });
                        });
                    }
                });
            }
        });
    });
});

users.get('/application/reject-schedule/:id', function(req, res, next) {
    db.getConnection(function(err, connection) {
        if (err) throw err;

        connection.query('SELECT * FROM application_schedules WHERE applicationID = ? AND status = 2', [req.params.id], function (error, new_schedule, fields) {
            if (error) {
                res.send({"status": 500, "error": error, "response": null});
            } else {
                let count = 0;
                async.forEach(new_schedule, function (obj, callback2) {
                    connection.query('DELETE FROM application_schedules WHERE ID = ?', [obj.ID], function (error, response, fields) {
                        if(!error)
                            count++;
                        callback2();
                    });
                }, function (data) {
                    connection.release();
                    res.send({"status": 200, "message": "Application schedule with "+count+" invoices deleted successfully!", "response": null});
                });
            }
        });
    });
});

users.post('/application/add-schedule/:id', function(req, res, next) {
    db.getConnection(function(err, connection) {
        if (err) throw err;

        let count = 0;
        async.forEach(req.body.schedule, function (obj, callback) {
            obj.applicationID = req.params.id;
            obj.status = 2;
            obj.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
            connection.query('INSERT INTO application_schedules SET ?', obj, function (error, response, fields) {
                if(!error)
                    count++;
                callback();
            });
        }, function (data) {
            connection.release();
            res.send({"status": 200, "message": "Application scheduled with "+count+" invoices successfully!", "response": null});
        })
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

users.post('/application/add-payment/:id/:agent_id', function(req, res, next) {
    let data = req.body;
    data.applicationID = req.params.id;
    data.payment_status = 1;
    data.payment_collect_date = data.interest_collect_date;
    db.query('INSERT INTO application_schedules SET ?', data, function (error, response, fields) {
        if(error){z
            res.send({"status": 500, "error": error, "response": null});
        } else {
            return res.send({"status": 200, "message": "Payment added successfully!"});
            // db.query('SELECT MAX(ID) AS ID from application_schedules', function(err, invoice_obj, fields) {
            //     let invoice = {};
            //     invoice.agentID = req.params.agent_id;
            //     invoice.applicationID = req.params.id;
            //     invoice.invoiceID = invoice_obj[0]['ID'];
            //     invoice.interest_amount = data.actual_interest_amount;
            //     invoice.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
            //     db.query('INSERT INTO schedule_history SET ?', invoice, function (error, response, fields) {
            //         if(error){
            //             res.send({"status": 500, "error": error, "response": null});
            //         } else {
            //             res.send({"status": 200, "message": "Payment added successfully!"});
            //         }
            //     });
            // });
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

users.post('/application/edit-schedule/:id/:modifier_id', function(req, res, next) {
    let data = req.body;
    data.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    data.modifierID = req.params.modifier_id;
    db.getConnection(function(err, connection) {
        if (err) throw err;

        connection.query('UPDATE application_schedules SET ? WHERE ID = '+req.params.id, data, function (error, response, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                connection.query('SELECT * FROM application_schedules WHERE ID = ?',[req.params.id], function (error, invoice_obj, fields) {
                    if(error){
                        res.send({"status": 500, "error": error, "response": null});
                    } else {
                        let invoice = {
                            invoiceID: invoice_obj[0].ID,
                            applicationID: invoice_obj[0].applicationID,
                            interest_amount: invoice_obj[0].interest_amount,
                            payment_amount: invoice_obj[0].payment_amount,
                            payment_collect_date: invoice_obj[0].payment_collect_date,
                            payment_create_date: invoice_obj[0].payment_create_date,
                            interest_collect_date: invoice_obj[0].interest_collect_date,
                            interest_create_date: invoice_obj[0].interest_create_date,
                            fees_amount: invoice_obj[0].fees_amount,
                            penalty_amount: invoice_obj[0].penalty_amount,
                            date_modified: invoice_obj[0].date_modified,
                            modifierID: invoice_obj[0].modifierID
                        };
                        if (invoice_obj[0]['interest_invoice_no'])
                            invoice['interest_invoice_no'] = invoice_obj[0]['interest_invoice_no'];
                        if (invoice_obj[0]['payment_invoice_no'])
                            invoice['payment_invoice_no'] = invoice_obj[0]['payment_invoice_no'];
                        connection.query('INSERT INTO edit_schedule_history SET ? ', invoice, function (error, response, fields) {
                            connection.release();
                            if(error){
                                res.send({"status": 500, "error": error, "response": null});
                            } else {
                                res.send({"status": 200, "message": "Schedule updated successfully!"});
                            }
                        });
                    }
                });
            }
        });
    });
});

users.get('/application/edit-schedule-history/:id', function(req, res, next) {
    db.query('SELECT s.ID, s.invoiceID, s.payment_amount, s.interest_amount, s.fees_amount, s.penalty_amount, s.payment_collect_date, s.date_modified, s.modifierID,' +
        's.applicationID, u.fullname AS modified_by FROM edit_schedule_history AS s, users AS u WHERE s.modifierID=u.ID AND invoiceID = ? ORDER BY ID desc', [req.params.id], function (error, history, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Edit schedule history fetched successfully!", "response":history});
        }
    });
});

users.get('/application/schedule-history/write-off/:id', function(req, res, next) {
    db.query('UPDATE application_schedules SET ? WHERE ID = '+req.params.id, {payment_status:2,date_modified:moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a')}, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Schedule write off successful!"});
        }
    });
});

users.post('/application/confirm-payment/:id/:application_id/:agent_id', function(req, res, next) {
    let data = req.body,
        postData = Object.assign({},req.body);
    postData.payment_status = 1;
    delete postData.payment_source;
    delete postData.payment_date;
    db.query('UPDATE application_schedules SET ? WHERE ID = '+req.params.id, postData, function (error, invoice, fields) {
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
            invoice.payment_source = data.payment_source;
            invoice.payment_date = data.payment_date;
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

// users.post('/application/escrow', function(req, res, next) {
//     let data = req.body,
//         date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
//     data.date_created = date;
//     db.query('SELECT * FROM escrow WHERE clientID = '+data.clientID, function (error, result, fields) {
//         if(error){
//             res.send({"status": 500, "error": error, "response": null});
//         } else {
//             if (result && result[0]){
//                 db.query('UPDATE escrow SET ? WHERE clientID = '+data.clientID, {amount:((parseFloat(data.amount)+parseFloat(result[0]['amount'])).round(2)),date_modified:date}, function (error, result, fields) {
//                     if(error){
//                         res.send({"status": 500, "error": error, "response": null});
//                     } else {
//                         res.send({"status": 200, "message": "Escrow credited successfully!"});
//                     }
//                 });
//             } else {
//                 db.query('INSERT INTO escrow SET ?', data, function (error, result, fields) {
//                     if(error){
//                         res.send({"status": 500, "error": error, "response": null});
//                     } else {
//                         res.send({"status": 200, "message": "Escrow credited successfully!"});
//                     }
//                 });
//             }
//         }
//     });
// });

users.post('/application/escrow', function(req, res, next) {
    let data = req.body;
    data.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('INSERT INTO escrow SET ?', data, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Escrow saved successfully!"});
        }
    });
});

users.post('/application/escrow/update/:clientID', function(req, res, next) {
    let data = req.body;
    data.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('UPDATE escrow SET ? WHERE clientID = '+req.params.clientID, data, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Escrow updated successfully!"});
        }
    });
});

users.get('/application/escrow-history/:clientID', function(req, res, next) {
    db.query('SELECT * FROM escrow WHERE clientID = '+req.params.clientID, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Escrow fetched successfully!", response: result});
        }
    });
});

Number.prototype.round = function(p) {
    p = p || 10;
    return parseFloat( this.toFixed(p) );
};

users.post('/application/disburse/:id', function(req, res, next) {
    let data = req.body;
    data.status = 2;
    data.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
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

users.get('/application/payment-reversal/:id/:invoice_id', function(req, res, next) {
    db.query('UPDATE schedule_history SET status=0 WHERE ID=?', [req.params.id], function (error, history, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            db.query('UPDATE application_schedules SET payment_status=0 WHERE ID=?', [req.params.invoice_id], function (error, history, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                } else {
                    res.send({"status": 200, "message": "Payment reversed successfully!", "response":history});
                }
            });
        }
    });
});

users.get('/application/escrow-payment-reversal/:id', function(req, res, next) {
    db.query('UPDATE escrow SET status=0 WHERE ID=?', [req.params.id], function (error, history, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Payment reversed successfully!"});
        }
    });
});


users.post('/application/loancirrus-id/:application_id', function(req, res, next) {
    db.query('UPDATE applications SET loanCirrusID=? WHERE ID=?', [req.body.id,req.params.application_id], function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Loan Cirrus ID updated successfully!"});
        }
    });
});

users.post('/application/pay-off/:id', function(req, res, next) {
    let data = req.body;
    data.close_status = 1;
    db.getConnection(function(err, connection) {
        if (err) throw err;

        connection.query('UPDATE applications SET ? WHERE ID = '+req.params.id, data, function (error, result, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                connection.query('SELECT * FROM application_schedules WHERE applicationID = ? AND status = 1 AND payment_status = 0', [req.params.id], function (error, invoices, fields) {
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
                            connection.query('UPDATE application_schedules SET payment_status=1 WHERE ID = ?', [invoice_obj.ID], function (error, result, fields) {
                                connection.query('INSERT INTO schedule_history SET ?', invoice, function (error, response, fields) {
                                    callback();
                                });
                            });
                        }, function (data) {
                            connection.release();
                            res.send({"status": 200, "message": "Application write off successful!"});
                        });
                    }
                });
            }
        });
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

users.post('/application/close/:id', function(req, res, next) {
    let data = req.body;
    data.close_status = 3;
    data.close_date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('UPDATE applications SET ? WHERE ID = '+req.params.id, data, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Application closed successful!"});
        }
    });
});

users.get('/application/cancel/:id', function(req, res, next) {
    let data = {};
    data.status = 0;
    db.query('UPDATE applications SET ? WHERE ID = '+req.params.id, data, function (error, result, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Application cancellation successful!"});
        }
    });
});

users.get('/forgot-password/:username', function(req, res) {
    let username = req.params.username;
    db.query('SELECT *, (select role_name from user_roles r where r.id = user_role) as role FROM users WHERE username = ?', username, function(err, rows, fields) {
        if (err)
            return res.send({"status": 500, "response": "Connection Error!"});

        if (rows.length === 0)
            return res.send({"status": 500, "response": "Incorrect Username/Password!"});

        if (rows[0].status === 0)
            return res.send({"status": 500, "response": "User Disabled!"});

        let user = rows[0];
        user.forgot_url = req.protocol + '://' + req.get('host') + '/forgot-password?t=' + encodeURIComponent(user.username);
        user.date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
        let mailOptions = {
            from: 'no-reply@loan35.com',
            to: user.email,
            subject: 'Loanratus: Forgot Password Request',
            template: 'forgot',
            context: user
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error)
                return res.send({"status": 500, "message": "Oops! An error occurred while sending request", "response": error});
            return res.send({"status": 200, "message": "Forgot Password request sent successfully!"});
        });

    });
});

users.post('/forgot-password', function(req, res) {
    let user = req.body,
        date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('UPDATE users SET password = ?, date_modified = ? WHERE username = ?', [bcrypt.hashSync(user.password, parseInt(process.env.SALT_ROUNDS)), date_modified, user.username], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send({"status": 200, "error": null, "response": results, "message": "User password updated!"});
        }
    });
});

/////// REPORTS



/* GET Report Cards. */
users.get('/report-cards', function(req, res, next) {
    let query, query1, query2, query3;
    query = 'select count(*) as branches from branches'
    query1 = 'select count(*) as loan_officers from users where ID not in (3, 4)'
    query2 = 'select count(*) as all_applications from applications where status = 2'
    query3 = 'select count(*) as apps from applications'
    var items = {}; var num;
    var den;
    db.query(query, function (error, results, fields) {
        items.branches = results;
        db.query(query1, function (error, results, fields) {
            items.loan_officers = results;
            db.query(query2, function (error, results, fields) {
                items.active_loans = results;
                db.query(query3, function (error, results, fields) {
                    den = parseInt(items.loan_officers[0]["loan_officers"]);
                    num = parseInt(results[0]["apps"])
                    avg_loan_per_officers = parseInt(num/den)
                    items.avg_loan_per_officers = avg_loan_per_officers;
                    res.send({"status": 200, "response": items})
                });
            });
        });
    });
    // den = items.loan_officers[0]["loan_officers"]; console.log(den)
});

/* Disbursements  */
users.get('/disbursements/filter', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end,
        loan_officer = req.query.officer
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let queryPart,
        query,
        query3,
        group
    queryPart = 'select \n' +
            '(select userID from applications where ID = applicationID) as user, (select fullname from clients where ID = user) as fullname, payment_amount, \n' +
            'applicationID, (select loan_amount from applications where ID = applicationID) as loan_amount, sum(payment_amount) as paid, \n' +
            '((select loan_amount from applications where ID = applicationID) - sum(payment_amount)) as balance, (select date_modified from applications where ID = applicationID) as date, \n' +
            '(select date_created from applications ap where ap.ID = applicationID) as created_date, ' +
            'CASE\n' +
            '    WHEN status = 0 THEN sum(payment_amount)\n' +
            'END as invalid_payment,\n' +
            'CASE\n' +
            '    WHEN status = 1 THEN sum(payment_amount)\n' +
            'END as valid_payment '+
            'from schedule_history \n' +
            'where applicationID in (select applicationID from application_schedules\n' +
            '\t\t\t\t\t\twhere applicationID in (select ID from applications where status = 2) and status = 1)\n'+
             'and status = 1 '
            ;
    group = 'group by applicationID';
    query = queryPart.concat(group);

    let query2 = 'select ID, (select fullname from clients where ID = userID) as fullname, loan_amount, date_modified, date_created ' +
                 'from applications where status = 2 and ID not in (select applicationID from schedule_history) '

    var items = {};
    if (loan_officer){
        queryPart = queryPart.concat('and (select loan_officer from clients where clients.ID = (select userID from applications where applications.ID = applicationID)) = ?')
        query = queryPart.concat(group);

        query2 = query2.concat('and (select loan_officer from clients where clients.ID = userID) = '+loan_officer+' ');
    }
    if (start  && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = (queryPart.concat('AND (TIMESTAMP((select date_modified from applications ap where ap.ID = applicationID)) between TIMESTAMP('+start+') and TIMESTAMP('+end+')) ')).concat(group);
        query2 = query2.concat('AND (TIMESTAMP(date_modified) between TIMESTAMP('+start+') AND TIMESTAMP('+end+')) ');
    }
    db.query(query, [loan_officer], function (error, results, fields) {
        items.with_payments = results;
        db.query(query2, [loan_officer],  function (error, results, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                items.without_pay = results;
                res.send({"status": 200, "error": null, "response": items, "message": "All Disbursements pulled!"});
            }
        });
    });
    // den = items.loan_officers[0]["loan_officers"]; console.log(den)
});

/* Interest Received  */
users.get('/interests/', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let queryPart,
        query,
        group
    queryPart = 'select \n' +
        '(select userID from applications where ID = applicationID) as user, (select fullname from clients where ID = user) as fullname, \n' +
        'applicationID, sum(interest_amount) as paid, \n' +
        '(select date_modified from applications where ID = applicationID) as date\n' +
        'from schedule_history \n' +
        'where applicationID in (select applicationID from application_schedules\n' +
        '\t\t\t\t\t\twhere applicationID in (select ID from applications where status = 2) and status = 1)\n' +
        'and status = 1\n';
    group = 'group by applicationID';
    query = queryPart.concat(group);
    var items = {};
    if (start  && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = (queryPart.concat('AND (TIMESTAMP((select date_created from applications ap where ap.ID = applicationID)) between TIMESTAMP('+start+') and TIMESTAMP('+end+')) ')).concat(group);
    }
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "error": null, "response": results, "message": "All Interests Received pulled!"});
        }
    });
});

/* Bad Loans - DeCommissioned  */
users.get('/bad-loans/', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let queryPart,
        query,
        group
    query = '\n' +
        'select ID, \n' +
        '(select fullname from clients where clients.ID = userID) as client, \n' +
        'loan_amount, date_created\n' +
        'from applications \n' +
        'where status = 2\n' +
        'and ID not in (select applicationID from schedule_history where status = 1)';
    if (start  && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = (query.concat('AND (TIMESTAMP(date_created) between TIMESTAMP('+start+') and TIMESTAMP('+end+')) '));
    }
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "error": null, "response": results, "message": "All Bad Loans pulled!"});
        }
    });
});

/* Overdue Loans  */
users.get('/overdues/', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let queryPart,
        query,
        group
    queryPart = 'select ID, applicationID,\n' +
        'payment_collect_date, (select fullname from clients where clients.ID = (select userID from applications where applications.ID = applicationID)) as client,\n' +
        '(select loan_amount from applications where applications.ID = applicationID) as principal,\n' +
        'sum(payment_amount) as amount_due, sum(interest_amount) as interest_due\n' +
        'from application_schedules\n' +
        'where payment_status = 0 and status = 1 and applicationID in (select a.ID from applications a where a.status = 2)\n' +
        'and payment_collect_date < (select curdate()) ';
    group = 'group by applicationID';
    query = queryPart.concat(group);
    if (start  && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = (queryPart.concat('AND (TIMESTAMP(payment_collect_date) between TIMESTAMP('+start+') and TIMESTAMP('+end+')) ')).concat(group);
    }
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "error": null, "response": results, "message": "All Overdue Loans pulled!"});
        }
    });
});

/* Bad Loans  */
users.get('/badloans/', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let queryPart,
        query,
        group
    queryPart = 'select ID, applicationID, \n' +
        'min(payment_collect_date) as duedate, (select fullname from clients where clients.ID = (select userID from applications where applications.ID = applicationID)) as client,\n' +
        '(select loan_amount from applications where applications.ID = applicationID) as principal,\n' +
        '(sum(payment_amount) - payment_amount) as amount_due, (sum(interest_amount) - interest_amount) as interest_due\n' +
        'from application_schedules\n' +
        'where payment_status = 0 and status = 1 and applicationID in (select a.ID from applications a where a.status = 2)\n';
    group = 'group by applicationID';
    query = queryPart.concat(group);
    if (start  && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = (queryPart.concat('AND (TIMESTAMP(payment_collect_date) between TIMESTAMP('+start+') and TIMESTAMP('+end+')) ')).concat(group);
    }
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "error": null, "response": results, "message": "All Overdue Loans pulled!"});
        }
    });
});

/* Payments */
users.get('/payments', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let queryPart,
        query,
        group
    queryPart = 'select \n' +
        '(select fullname from clients where ID = (select userID from applications where ID = applicationID)) as fullname,\n' +
        '(select userID from applications where ID = applicationID) as clientid,\n' +
        'applicationID, sum(payment_amount) as paid, sum(interest_amount) as interest, max(date_created) as date\n' +
        'from schedule_history \n' +
        'where applicationID in (select ID from applications) and status = 1\n ';
    group = 'group by applicationID';
    query = queryPart.concat(group);
    let query2 = 'select sum(payment_amount + interest_amount) as total from schedule_history \n' +
        'where applicationID in (select ID from applications)\n' +
        'and status = 1 '
    var items = {};
    if (start  && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = (queryPart.concat('AND (TIMESTAMP(date_created) between TIMESTAMP('+start+') and TIMESTAMP('+end+')) ')).concat(group);
        query2 = query2.concat('AND (TIMESTAMP(date_created) between TIMESTAMP('+start+') AND TIMESTAMP('+end+')) ');
    }
    db.query(query, function (error, results, fields) {
        items.payment = results;
        db.query(query2, function (error, results, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                items.total = results;
                res.send({"status": 200, "error": null, "response": items, "message": "All Payments pulled!"});
            }
        });
    });
    // den = items.loan_officers[0]["loan_officers"]; console.log(den)
});

/* Loans by Branches */
users.get('/loans-by-branches', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let queryPart,
        query,
        group
    queryPart = 'select (select branch from clients where ID = userID) as branchID, \n' +
            '(select branch_name from branches br where br.id = branchID) as branch,\n' +
            'loan_amount, sum(loan_amount) as disbursed,\n' +
            '(select sum(payment_amount) from schedule_history sh\n' +
            'where sh.status = 1 and \n' +
            '(select branch from clients c where c.ID = (select userID from applications b where b.ID = sh.applicationID)) = branchID ' +
            'and sh.applicationID in (select ap.ID from applications ap where ap.status = 2)) as collected\n' +
            '\n' +
            'from applications a\n' +
            'where status = 2\n ';
    group = 'group by branchID';
    query = queryPart.concat(group);
    var items = {};
    if (start  && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = (queryPart.concat('AND (TIMESTAMP(date_created) between TIMESTAMP('+start+') and TIMESTAMP('+end+')) ')).concat(group);
    }
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "error": null, "response": results, "message": "All Payments pulled!"});
        }
    });
});

/* Projected Interests */
users.get('/projected-interests', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end
    end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let queryPart,
        queryPart2,
        query,
        group
    queryPart = 'select applicationID, sum(interest_amount) as interest_due,\n' +
        '(select userID from applications a where a.ID = applicationID) as clientID,\n' +
        '(select fullname from clients c where c.ID = (select userID from applications a where a.ID = applicationID)) as client\n' +
        'from application_schedules \n' +
        'where applicationID in (select a.ID from applications a where a.status = 2 )\n ';
    group = 'group by applicationID order by applicationID asc ';
    query = queryPart.concat(group);
    queryPart2 = 'select applicationID, sum(interest_amount) as interest_paid\n' +
        'from schedule_history\n' +
        'where status = 1\n' +
        'and applicationID in (select a.ID from applications a where a.status = 2) '
    query2= queryPart2.concat(group);
    var items = {};
    if (start && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = (queryPart.concat('AND (TIMESTAMP((select date_created from applications ap where ap.ID = applicationID)) between TIMESTAMP('+start+') and TIMESTAMP('+end+')) ')).concat(group);
        query2 = (queryPart2.concat('AND (TIMESTAMP((select date_created from applications ap where ap.ID = applicationID)) between TIMESTAMP('+start+') AND TIMESTAMP('+end+')) ')).concat(group);
    }
    db.query(query, function (error, results, fields) {
        items.due = results;
        db.query(query2, function (error, results, fields) {
            if(error){
                res.send({"status": 500, "error": error, "response": null});
            } else {
                items.paid = results;
                res.send({"status": 200, "error": null, "response": items, "message": "All Payments pulled!"});
            }
        });
    });
    // den = items.loan_officers[0]["loan_officers"]; console.log(den)
});

/* Aggregate Projected Interests */
users.get('/agg-projected-interests', function(req, res, next) {
    let start = req.query.start,
        end = req.query.end
    // end = moment(end).add(1, 'days').format("YYYY-MM-DD");
    let query,
        group
    query = 'select sum(interest_amount) as total \n' +
        'from application_schedules\n' +
        'where applicationID in (select ID from applications where status = 2)\n' +
        'and status = 1 and payment_status = 0 '

    if (start && end){
        start = "'"+start+"'"
        end = "'"+end+"'"
        query = query.concat('and timestamp(interest_collect_date) between TIMESTAMP('+start+') and TIMESTAMP('+end+')');
    }
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "error": null, "response": results, "message": "Success!"});
        }
    });
    // den = items.loan_officers[0]["loan_officers"]; console.log(den)
});

/////// Activity
/*Create New Activity Type*/
users.post('/new-activity-type', function(req, res, next) {
    let postData = req.body,
        query =  'INSERT INTO activity_types Set ?',
        query2 = 'select * from activity_types where activity_name = ?';
    postData.status = 1;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query(query2,req.body.role, function (error, results, fields) {
        if (results && results[0])
            return res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "Activity type already exists!"}));
        db.query(query,{"activity_name":postData.role, "date_created": postData.date_created, "status": 1}, function (error, results, fields) {
            if(error){
                res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            } else {
                res.send(JSON.stringify({"status": 200, "error": null, "response": "New Activity Type Added!"}));
            }
        });
    });
});

users.get('/activity-types', function(req, res, next) {
    let query = 'SELECT * from activity_types where status = 1';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

/* Add New Activity */
users.post('/new-activity', function(req, res, next) {
    let data = [],
        postData = req.body,
        query =  'INSERT INTO activities Set ?';
    postData.status = 1;
    postData.date_created = Date.now();
    db.getConnection(function(err, connection) {
        if (err) throw err;

        connection.query(query,postData, function (error, results, fields) {
            if(error){
                res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            } else {
                res.send(JSON.stringify({"status": 200, "error": null, "response": "New Activity Created"}));
            }
        });
    });
});

/* All Activities */
users.get('/activities', function(req, res, next) {
    let current_user = req.query.user;
    let team = req.query.team;
    let query = 'SELECT *, (select fullname from clients c where c.ID = client) as clients from activities where for_ = ? and status = 1 and team = ?';
    db.query(query, [current_user, team], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

/* Teams */
users.get('/teams', function(req, res, next) {
    let current_user = req.query.user;
    let query = 'select teamID, (select name from teams where teams.id = teamID) as team_name from team_members where memberID = ' +
                '(select users.ID from users where users.fullname = ? and users.status = 1) and status = 1'
    db.query(query, [current_user], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

/* Team Activities */
users.get('/team-activities', function(req, res, next) {
    let current_user = req.query.user;
    let query = 'select *, (select name from teams where teams.Id = team) as team_name ' +
                'from activities where ' +
                'category = team and ' +
                'for_ in (select fullname from users where users.id in (select memberID from team_members where teamID in (select teamID from team_members where memberID = (select users.ID from users where users.fullname = ? and users.status = 1 ) and status = 1)  and status = 1) ) ' +
                'and for_ <> ?';
    db.query(query, [current_user, current_user], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify(results));
        }
    });
});

module.exports = users;