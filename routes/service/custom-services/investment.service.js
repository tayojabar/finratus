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


router.get('/get-investments', function (req, res, next) {
    let limit = req.query.limit;
    let offset = req.query.offset;
    let draw = req.query.draw;
    let order = req.query.order;
    let search_string = req.query.search_string.toUpperCase();
    console.log(search_string);
    let query = `SELECT v.ID,p.name AS investment,c.fullname AS client,amount, investment_start_date, investment_mature_date
    FROM investments v inner join investment_products p on
    v.productId = p.ID inner join clients c on
    v.clientId = c.ID WHERE upper(p.code) LIKE "${search_string}%" OR upper(p.name) LIKE "${search_string}%" 
    OR upper(c.fullname) LIKE "${search_string}%" ${order} LIMIT ${limit} OFFSET ${offset}`;
    let endpoint = '/core-service/get';
    let url = `${HOST}${endpoint}`;
    var data = [];
    axios.get(url, {
        params: {
            query: query
        }
    }).then(response => {
        console.log(response.data);
        query = `SELECT count(*) AS recordsTotal, (SELECT count(*) FROM test.investments v 
                    inner join test.investment_products p on v.productId = p.ID inner join test.clients c on
                    v.clientId = c.ID WHERE upper(p.code) LIKE "${search_string}%" OR upper(p.name) LIKE "${search_string}%" 
                    OR upper(c.fullname) LIKE "${search_string}%") as recordsFiltered FROM test.investments`;
        endpoint = '/core-service/get';
        url = `${HOST}${endpoint}`;
        axios.get(url, {
            params: {
                query: query
            }
        }).then(payload => {
            console.log(payload.data);
            res.send({
                draw: draw,
                recordsTotal: payload.data[0].recordsTotal,
                recordsFiltered: payload.data[0].recordsFiltered,
                data: (response.data === undefined) ? [] : response.data
            });
        });
    });


});


module.exports = router;