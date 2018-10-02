// Loads the environment variables from the .env file
require('dotenv').config();

let mysql = require('mysql'),
    config = require('./config'),
    status = process.env.STATUS || 'development',
    mysqlConfig = config[status],
    connection = mysql.createConnection(mysqlConfig);

module.exports = connection;