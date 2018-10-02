let mysql = require('mysql'),
    config = require('config');
    mysqlConfig = config.
var connection = mysql.createConnection({

});

module.exports = connection;