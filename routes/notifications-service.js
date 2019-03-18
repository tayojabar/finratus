const express = require('express');
const axios = require('axios');

let token,
    fs = require('fs'),
    db = require('../db'),
    _ = require('lodash'),
    path = require('path'),
    route = express.Router(),
    async = require('async'),
    mac = require('getmac'),
    moment  = require('moment');

let middlewares = {};
middlewares.log = function log(req,payload) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    var data = req.body
    // const HOST = 'http://localhost:4000'
    payload.status = 1;
    payload.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    payload.ip_address = req.header('x-forwarded-for');
    let query = `INSERT INTO notifications SET ?`;
    const endpoint = `/core-service/post?query=${query}`;
    const url = `${HOST}${endpoint}`;
    axios.post(url, payload)
        .then(function (response) {
            let result = response.data;
            // res.send(response.data);
            let query2 = 'insert into pending_records set ?';
            const address = `/core-service/post?query=${query2}`;
            const uri = `${HOST}${address}`;
            const info = {}
            info.notification_id = result.insertId
            info.notification_category = payload.category;
            info.view_status = 1
            axios.post(uri, info)
                .then(function (response) {
                    let result = response.data;
                    // res.send(response.data);
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

};

module.exports = middlewares;