var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : '140.86.3.244',
    //port :'49436',
    user     : 'appuser',
    password : 'Pass@word1',
    database : 'vehicle_inspection',
    insecureAuth: true
});

connection.connect(function(err) {
    if (err) {
       return console.error('error connecting: ' + err.stack);
    }
    console.log('connected as id ' + connection.threadId);
});

module.exports = connection;