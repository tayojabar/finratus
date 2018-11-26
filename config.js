let config = {};

config.development = {
    host     : '140.86.3.63',
    port     : '3306',
    user     : 'appuser',
    password : 'Pass@word1',
    database : 'vehicle_inspection',
    insecureAuth: true
};

config.staging = {
    host     : 'atobz-staging-mysqldbserver.mysql.database.azure.com',
    port     :'3306',
    user     : 'azurestaging@atobz-staging-mysqldbserver',
    password : 'password123*',
    database : 'azurestaging',
    insecureAuth: true
};

config.production = {
    host     : 'atobz-mysqldbserver.mysql.database.azure.com',
    port     : '3306',
    user     : 'loan35dbadmin@atobz-mysqldbserver',
    password : 'Loan35Pass@word2018',
    database : 'loan35',
    insecureAuth: true
};

module.exports = config;