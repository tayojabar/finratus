// Loads the environment variables from the .env file
require('dotenv').config();

let mysql = require('mysql'),
    config = require('./config'),
    status = process.env.STATUS || 'development',
    mysqlConfig = config[status];

mysqlConfig.connectionLimit = 10;

module.exports = mysql.createPool(mysqlConfig);