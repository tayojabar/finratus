let config = {};

config.development = {
    host     : 'atobz-mysqldbserver.mysql.database.azure.com',
    port     : '3306',
    user     : 'loan35dbadmin@atobz-mysqldbserver',
    password : 'Loan35Pass@word2018',
    database : 'test',
    insecureAuth: true
};

config.staging = {
    host     : 'atobz-mysqldbserver.mysql.database.azure.com',
    port     : '3306',
    user     : 'loan35dbadmin@atobz-mysqldbserver',
    password : 'Loan35Pass@word2018',
    database : 'staging',
    insecureAuth: true
};

config.live = {
    host     : 'atobz-mysqldbserver.mysql.database.azure.com',
    port     : '3306',
    user     : 'loan35dbadmin@atobz-mysqldbserver',
    password : 'Loan35Pass@word2018',
    database : 'loan35',
    insecureAuth: true
};

config.production = {
    host     : '140.86.3.244',
    port     : '3306',
    user     : 'loan35admin',
    password : 'Pass@word1',
    database : 'loan35',
    insecureAuth: true
};

module.exports = config;