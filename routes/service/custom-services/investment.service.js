const express = require('express');
const axios = require('axios');
const moment = require('moment');
const router = express.Router();
const config = require('../config/default.json');
var isAfter = require('date-fns/is_after');



const HOST = `${config.protocol}://${config.host}:${config.port}`;

router.post('/create', function (req, res, next) {
    var data = req.body
    const is_after = isAfter(new Date(data.investment_mature_date.toString()), new Date(data.investment_start_date.toString()))
    if (is_after) {
        data.status = 1;
        data.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
        let query = `INSERT INTO investments SET ?`;
        const endpoint = `/core-service/post?query=${query}`;
        const url = `${HOST}${endpoint}`;
        axios.post(url, data)
            .then(function (response) {
                console.log(response.data);
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
    } else {
        res.send({
            status: 500,
            error: {
                message: "Start date can not be greater than the end date"
            },
            response: null
        });
    }

});


module.exports = router;