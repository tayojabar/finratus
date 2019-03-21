const express = require('express');
const axios = require('axios');
const CronJob = require('cron').CronJob;
let token,
    fs = require('fs'),
    db = require('../db'),
    _ = require('lodash'),
    path = require('path'),
    route = express.Router(),
    async = require('async'),
    mac = require('getmac'),
    moment  = require('moment');

var mac_address;
mac.getMac(function(err, macAddress){
    if (err)  throw err
    mac_address = macAddress;
});
// const job = new CronJob('* * * * * *', function(res, req, err) {

route.get('/new-updates', function(req, res) {
    const HOST = 'http://localhost:4000'
    let user = req.query.bug
    let query_ = 'select id from notification_preferences where userid = '+user+''
    // let query = `select notification_id, category, description, date_created, (select fullname from users where users.id = userid) user from pending_records inner join notifications on notification_id = notifications.id where status = 1 and view_status in (1,2) order by notification_id desc`;
    const endpoint = `/core-service/get?query=${query_}`;
    const url = `${HOST}${endpoint}`;
    axios.get(url)
        .then(function (response) {
            let query;
            if (response.data.length > 0){
                query = 'select notification_id, category, description, date_created, view_status, userid, (select fullname from users where users.id = userid) user \n' +
                    'from pending_records inner join notifications nt on notification_id = nt.id \n' +
                    'where status = 1 and view_status in (1,2) \n' +
                    'and category in \n' +
                    '(select category_name from notification_categories nc where nc.id in \n' +
                    '(select np.category from notification_preferences np where status = 1 and np.userid = '+user+'))\n' +
                    'and (select compulsory from notification_categories where category = category_name) <> 1\n' +
                    'order by notification_id desc'
            }
            else {
                query = 'select notification_id, category, description, date_created, (select fullname from users where users.id = userid) user \n'+
                'from pending_records inner join notifications on notification_id = notifications.id \n'+
                'where status = 1 and view_status in (1,2) order by notification_id desc';
            }
            const api = `/core-service/get?query=${query}`;
            const uri = `${HOST}${api}`;
            axios.get(uri)
                .then(function (response) {
                    // if (response.data)
                    res.send(response.data);
                }, err => {
                    res.send({
                        status: 500,
                        error: error,
                        response: null
                    });
                })
                .catch(function (error) {
                    res.send({
                        status: 500,
                        error: error,
                        response: null
                    });
                });
        }, err => {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

route.get('/update-pr', function(req, res) {
    let id = req.query.notification_id;
    let val = req.query.val;
    const HOST = 'http://localhost:4000'
    let query = 'update pending_records set view_status = '+val+' where notification_id = '+id+' ';
    const endpoint = `/core-service/get?query=${query}`;
    const url = `${HOST}${endpoint}`;
    axios.get(url)
        .then(function (response) {
            // console.log(response.data)
            res.send(response);
        }, err => {
            // console.log(err)
            res.send({
                status: 500,
                error: error,
                response: null
            });
        })
        .catch(function (error) {
            // console.log(error)
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

route.get('/categories', function(req, res, next) {
    let query = 'SELECT * from notification_categories';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            let response = _.orderBy(results, ['category_name']);
            res.send(response);
        }
    });
});

route.post('/new-category', function(req, res, next) {
    let postData = req.body,
        query =  'INSERT INTO notification_categories Set ?',
        query2 = 'select * from notification_categories where category_name = ?';
    postData.status = 1;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query(query2,req.body.role, function (error, results, fields) {
        if (results && results[0])
            return res.send(JSON.stringify({"status": 200, "error": null, "response": results, "message": "Category already exists!"}));
        db.query(query,{"category_name":postData.cat, "date_created": postData.date_created, "status": 1}, function (error, results, fields) {
            if(error){
                res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            } else {
                res.send(JSON.stringify({"status": 200, "error": null, "response": "New Category Added!"}));
            }
        });
    });
});

route.post('/del-category/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update notification_categories SET status = 0, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Category Disabled!"}));
        }
    });
});

route.post('/en-category/:id', function(req, res, next) {
    let date = Date.now(),
        postData = req.body;
    postData.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let payload = [postData.date_modified, req.params.id],
        query = 'Update notification_categories SET status = 1, date_modified = ? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Category Re-enabled!"}));
        }
    });
});

route.post('/savePreferences/:user', function(req, res, next) {
    let ids = req.body,
        userid = ids.userid,
        count = 0,
        status = true;
    db.getConnection(function(err, connection) {
        if (err) throw err;

        async.forEach(ids.cats, function (id, callback) {
            let category = id[0],
                status = id[1],
                query = 'INSERT INTO notification_preferences SET ?';
            connection.query(query, {userid:userid, category:category, status:status, date_created:moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a')}, function (error, results, fields) {
                if(error){
                    status = false;
                    callback({"status": 500, "error": error, "response": null});
                } else {
                    count++;
                }
                callback();
            });
        }, function (data) {
            connection.release();
            if(status === false)
                return res.send(data);
            res.send({"status": 200, "error": null, "message": "User Preferences Set!"});
        })
    });
});

// job.start();
module.exports = route;