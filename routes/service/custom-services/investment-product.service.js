const express = require('express');
const axios = require('axios');
const router = express.Router();

//Get Investment Product
router.get('/all', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let page = ((req.query.page - 1) * 10 < 0) ? 0 : (req.query.page - 1) * 10;
    let search_string = (req.query.search_string === undefined) ? "" : req.query.search_string.toUpperCase();
    let query = `SELECT ID,name,code,investment_max,investment_min,min_term,max_term FROM investment_products WHERE upper(code) LIKE "${search_string}%" OR upper(name) LIKE "${search_string}%" ORDER BY ID desc LIMIT ${limit} OFFSET ${page}`;
    const endpoint = "/core-service/get";
    const url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            console.log(response.data);
            res.send(response.data);
        }, err => {
            res.send(err);
        })
        .catch(function (error) {
            res.send(error);
        });
});


router.get('/get-products', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let draw = req.query.draw;
    let order = req.query.order;
    let search_string = req.query.search_string.toUpperCase();
    console.log(search_string);
    let query = `SELECT ID,name,code,investment_max,investment_min,interest_rate,status, date_created 
    FROM investment_products WHERE status = 1 AND code LIKE "${search_string}%" OR name LIKE "${search_string}%" 
    ${order} LIMIT ${limit} OFFSET ${offset}`;
    let endpoint = '/core-service/get';
    let url = `${HOST}${endpoint}`;
    var data = [];
    axios.get(url, {
        params: {
            query: query
        }
    }).then(response => {
        console.log(response.data);
        query = `SELECT count(*) AS recordsTotal, (SELECT count(*) FROM investment_products 
        WHERE  status = 1 AND code LIKE "${search_string}%" OR name LIKE "${search_string}%") as recordsFiltered FROM investment_products`;
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