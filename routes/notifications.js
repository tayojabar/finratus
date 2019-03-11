const express = require('express');
let token,
    fs = require('fs'),
    db = require('../db'),
    _ = require('lodash'),
    path = require('path'),
    route = express.Router(),
    async = require('async'),
    moment  = require('moment');

route.post('/log', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    var data = req.body
    data.status = 1;
    data.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `INSERT INTO notifications SET ?`;
    const endpoint = `/core-service/post?query=${query}`;
    const url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
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

});
