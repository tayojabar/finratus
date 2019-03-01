const express = require('express');
const axios = require('axios');
const router = express.Router();
const config = require('../config/default.json');
const HOST = `${config.protocol}://${config.host}:${config.port}`;

//Get Investment Product
router.get('/all', function (req, res, next) {
    let limit = req.query.limit;
    let page = ((req.query.page - 1) * 10 < 0) ? 0 : (req.query.page - 1) * 10;
    let search_string = (req.query.search_string === undefined) ? "" : req.query.search_string;
    let query = `SELECT ID,name,code FROM investment_products WHERE code LIKE "${search_string}%" OR name LIKE "${search_string}%" ORDER BY ID desc LIMIT ${limit} OFFSET ${page}`;
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


module.exports = router;