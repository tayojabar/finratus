let config = {};

config.development = {
    host     : '140.86.3.185',
    port :'3306',
    user     : 'appuser',
    password : 'Pass@word1',
    database : 'vehicle_inspection',
    insecureAuth: true
};

// config.production = {
//     host     : 'loan-35-mysqldbserver.mysql.database.azure.com',
//     port     :'3306',
//     user     : 'loan35dbadmin@loan-35-mysqldbserver',
//     password : 'Loan35Pass@word2018',
//     database : 'loan35',
//     insecureAuth: true
// };

config.production = {
    host     : 'atobz-mysqldbserver.mysql.database.azure.com',
    port     :'3306',
    user     : 'loan35dbadmin@atobz-mysqldbserver',
    password : 'Loan35Pass@word2018',
    database : 'loan35',
    insecureAuth: true
};

module.exports = config;