const express = require('express');
const router = express.Router();

router.post('/investment-products', function(req, res, next) {
    let postData = req.body,
        query =  'INSERT INTO investment-products Set ?',
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
                    res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
                } else {
                    res.send(JSON.stringify({"status": 200, "error": null, "response": re}));
                }
            });
        });
    });
});

module.exports = router;