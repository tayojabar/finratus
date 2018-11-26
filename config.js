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
<<<<<<< HEAD
    host     : 'azurestaging-mysqldbserver.mysql.database.azure.com',
    port     : '3306',
    user     : 'azurestaging@atobz-staging-mysqldbserver',
=======
    host     : 'azure-staging-mysqldbserver.mysql.database.azure.com',
    port     :'3306',
    user     : 'azure-staging@atobz-staging-mysqldbserver',
>>>>>>> 82889e8f8270982d55b311c4b9a9359f64fc2c84
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