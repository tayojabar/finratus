const express = require('express');
const moment = require('moment');
const db = require('../db');
const router = express.Router();

router.post('/products', function (req, res, next) {
    let data = req.body;
    data.status = 1;
    data.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    db.query('INSERT INTO investment_products SET ?', data, function (error, result, fields) {
        if (error) {
            res.send({
                "status": 500,
                "error": error,
                "response": null
            });
        } else {
            res.send({
                "status": 200,
                "message": "Investment product saved successfully!"
            });
        }
    });
});

//Get Investment Product
router.get('/products', function (req, res, next) {
    const limit = req.query.limit;
    const offset = limit * req.query.page;
    console.log(limit, offset);
    let query = `SELECT * FROM investment_products LIMIT ${limit} OFFSET ${offset}`;
    db.query(query, function (error, results, fields) {
        if (error) {
            res.send({
                "status": 500,
                "error": error,
                "response": null
            });
        } else {
            res.send(results);
        }
    });
});

module.exports = router;