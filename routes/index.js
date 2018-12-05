var express = require('express');
var router = express.Router();
var async = require('async');
var db = require('../db');
const fs = require('fs');
const moment = require('moment');

//File Upload - Inspection
router.post('/upload/:number_plate/:part', function(req, res) {
    if (!req.files) return res.status(400).send('No files were uploaded.');
    if (!req.params) return res.status(400).send('No parameters specified!');
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.file;
    let name = sampleFile.name;
    let extArray = sampleFile.name.split(".");
    let extension = extArray[extArray.length - 1];
    let fileName = name+'.'+extension;

    fs.stat('files/'+req.params.number_plate+'/', function(err) {
        if (!err) {
            console.log('file or directory exists');
        }
        else if (err.code === 'ENOENT') {
            // console.log('file or directory does not exist');
            // console.log('Creating directory ...')
            fs.mkdirSync('files/'+req.params.number_plate+'/');
        }
    });

    fs.stat('files/'+req.params.number_plate+'/'+req.params.number_plate+'_'+req.params.part+'.'+extension, function (err) {
        //console.log(stats);//here we got all information of file in stats variable

        if (err) {// If file doesn't exist
            //return console.error(err);
            // Use the mv() method to place the file somewhere on your server
            sampleFile.mv('files/'+req.params.number_plate+'/'+req.params.number_plate+'_'+req.params.part+'.'+extension, function(err) {
                if (err) return res.status(500).send(err);
                // console.log(req.params.number_plate+'_'+req.params.part+'.'+extension);
                res.send('File uploaded!');
            });
        }
        else{
            fs.unlink('files/'+req.params.number_plate+'/'+req.params.number_plate+'_'+req.params.part+'.'+extension,function(err){
                if(err){
                    return console.log(err);
                }
                else{
                    sampleFile.mv('files/'+req.params.number_plate+'/'+req.params.number_plate+'_'+req.params.part+'.'+extension, function(err) {
                        if (err)
                            return res.status(500).send(err);

                        res.send('File uploaded!');
                    });
                }
                //console.log('file deleted successfully');
            });
        }

    });


});

//File Upload - Vehicle Registration
router.post('/vehicle-upload/:number_plate/', function(req, res) {
    if (!req.files) return res.status(400).send('No files were uploaded.');
    if (!req.params) return res.status(400).send('No Number Plate specified!');
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.file;
    let name = sampleFile.name;
    let extArray = sampleFile.name.split(".");
    let extension = extArray[extArray.length - 1];
    let fileName = name+'.'+extension;
    //console.log(name);

    fs.stat('files/'+req.params.number_plate+'/', function(err) {
        if (!err) {
            console.log('file or directory exists');
        }
        else if (err.code === 'ENOENT') {
            console.log('file or directory does not exist');
            console.log('Creating directory ...')
            fs.mkdirSync('files/'+req.params.number_plate+'/');
        }
    });

    fs.stat('files/'+req.params.number_plate+'/'+req.params.number_plate+'_registration.'+extension, function (err) {
        //console.log(stats);//here we got all information of file in stats variable

        if (err) {// If file doesn't exist
            //return console.error(err);
            // Use the mv() method to place the file somewhere on your server
            sampleFile.mv('files/'+req.params.number_plate+'/'+req.params.number_plate+'_registration.'+extension, function(err) {
                if (err) return res.status(500).send(err);
                console.log(req.params.number_plate+'_registration.'+extension);
                res.send('File uploaded!');
            });
        }
        else{
            fs.unlink('files/'+req.params.number_plate+'/'+req.params.number_plate+'_registration.'+extension,function(err){
                if(err){
                    console.log(err);
                    res.send('Unable to delete file!');
                }
                else{
                    sampleFile.mv('files/'+req.params.number_plate+'/'+req.params.number_plate+'_registration.'+extension, function(err) {
                        if (err)
                            return res.status(500).send(err);

                        res.send('File uploaded!');
                    });
                }
                //console.log('file deleted successfully');
            });
        }

    });


});

/* Add New Vehicle */
router.post('/addVehicle', function(req, res, next) {
    var postData = req.body;
    postData.Date_Created = Date.now();
    payload = [];
    var query =  'INSERT INTO vehicles set ?';
    db.query(query, postData, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "New Vehicle Added!"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET Vehicle Owners listing. */
router.get('/owners', function(req, res, next) {
    var query = 'SELECT * from vehicle_owners';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET vehicles listing. */
router.get('/vehicles', function(req, res, next) {
    var query = 'SELECT * from vehicles';
    var array = [];
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            async.forEach(results, function(k, cb){
                var path = 'files/'+k.Number_Plate+'/';
                if (fs.existsSync(path)){
                    fs.readdir(path, function (err, files){
                        console.log(path+': Exists, hence image '+JSON.stringify(files));
                        var obj = {};
                        async.forEach(files, function (file, callback){
                            let insP = file.split('.')[0].split('_')[1];
                            obj[insP] = path+file;
                            k.images = obj;
                            callback();
                        }, function(data){
                            array.push(k);
                            cb();
                        });
                    })	;
                }
                else {
                    k.images = "No Image";
                    array.push(k);
                    cb();
                }

            }, function(data){
                res.send(JSON.stringify({"status": 200, "error": null, "response": array}));
                //If there is no error, all is good and response is 200OK.
            });
        }
    });
});

/* GET vehicle inspection images. */
router.get('/inspection-images/:number_plate', function(req, res, next) {
    var array = [];
    var path = 'files/'+req.params.number_plate+'/';
    if (fs.existsSync(path)){
        fs.readdir(path, function (err, files){
            console.log(path+': Exists, hence image '+JSON.stringify(files));
            var obj = {};
            async.forEach(files, function (file, callback){
                let insP = file.split('.')[0].split('_')[1];
                obj[insP] = path+file;
                //res.images = obj;
                callback();
            }, function(data){
                //array.push(res);
                res.send(JSON.stringify({"status": 200, "response":obj}));
            });
        })	;
    }
    else {
        res.send(JSON.stringify({"status":500, "response": "No Image Uploaded"}));
    }
});

/* GET vehicles listing for admin. */
router.get('/vehicles-list', function(req, res, next) {
    var query = 'SELECT *, (select fullname from users u where u.ID = owner) as Owner from vehicles order by ID desc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET all vehicle makes available for admin. */
router.get('/makes-list', function(req, res, next) {
    var query = 'SELECT distinct(make) from vehiclemakes group by make';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET all vehicle models by make available for admin. */
router.get('/models-list/:make', function(req, res, next) {
    var query = 'SELECT model, year from vehiclemakes where make =?';
    console.log(query);
    db.query(query, [req.params.make], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET vehicles count. */
router.get('/vehiclesCount', function(req, res, next) {
    var query = 'SELECT count(*) as total from vehicles';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET vehicle owners count. */
router.get('/ownersCount', function(req, res, next) {
    var query = 'SELECT count(*) as total from users where user_role = 4';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET car models count. */
router.get('/modelsCount', function(req, res, next) {
    var query = 'SELECT count(*) as total from vehiclemakes';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.get('/check', function(req, res, next) {
    res.send(req.session.user.user_role);
});

/* GET specific vehicle by parameter */
/**
 * @Query:
 * number_plate
 */
router.get('/vehicles/:number_plate/', function(req, res, next) {
    var query = 'SELECT * from vehicles where number_plate =?';
    var path = 'files/'+req.params.number_plate+'/';
    var array = [];
    db.query(query, [req.params.number_plate, req.params.date] ,function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            // fs.stat(path, function(err) {

            // 	if (!err){
            // 		var items = [];
            // 		var obj = {};
            // 		fs.readdir(path, function (err, files){
            // 			files.forEach(function (file){
            // 				//items.push(file);
            // 				let part = file.split('.')[0].split('_')[1];
            // 				obj[part] = path+file;
            // 			});
            // 			//console.log(items);
            // 			//listDirectoryItems(path);
            // 			res.send(JSON.stringify({"status": 200, "error": null, "response": results, "image": obj}));
            // 		})	;
            // 		//items = getdirectoryItems(path, req, res);
            // 	}else{
            // 	res.send(JSON.stringify({"status": 200, "error": null, "response": results, "path": "No Image Uploaded Yet"}));
            // 	}
            // });
            //If there is no error, all is good and response is 200OK.
            async.forEach(results, function(k, cb){
                var path = 'files/'+k.Number_Plate+'/';
                if (fs.existsSync(path)){
                    fs.readdir(path, function (err, files){
                        console.log(path+': Exists, hence image '+JSON.stringify(files));
                        var obj = {};
                        async.forEach(files, function (file, callback){
                            let insP = file.split('.')[0].split('_')[1];
                            obj[insP] = path+file;
                            k.images = obj;
                            callback();
                        }, function(data){
                            array.push(k);
                            cb();
                        });
                    })	;
                }
                else {
                    k.images = "No Image";
                    array.push(k);
                    cb();
                }

            }, function(data){
                res.send(JSON.stringify({"status": 200, "error": null, "response": array}));
                //If there is no error, all is good and response is 200OK.
            });
        }
    });
});

/* GET specific vehicle by owner */
router.get('/vehicles-owner/:owner', function(req, res, next) {
    var query = 'SELECT * from vehicles where owner =?';
    var array = [];

    db.query(query, [req.params.owner] ,function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
        } else {
            async.forEach(results, function(k, cb){
                //k.image = 'goal';
                var path = 'files/'+k.Number_Plate+'/';
                //console.log(k);
                if (fs.existsSync(path)){
                    fs.readdir(path, function (err, files){
                        var obj = {};
                        console.log(path+': Exists, hence image');
                        async.forEach(files, function (file, callback){
                            let part = file.split('.')[0].split('_')[1];
                            obj[part] = path+file;
                            k.images = obj;
                            callback();
                        }, function(data){
                            array.push(k);
                            cb();
                        });
                    })	;
                }
                else {
                    console.log(path+': Doesnt Exist, no image');
                    k.images = "No Image";
                    array.push(k);
                    cb();
                }

            }, function(data){
                res.send(JSON.stringify({"status": 200, "error": null, "response": array}))
                //If there is no error, all is good and response is 200OK.
            });
        }
    });
});

/* GET specific vehicle by owner for admin. */
router.get('/vehicle-owner/:owner', function(req, res, next) {
    var query = 'SELECT * from vehicles where owner = ?';
    console.log(query);
    db.query(query, [req.params.owner], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET specific inspections for vehicle for admin. */
router.get('/vehicle-inspections/:number', function(req, res, next) {
    var query = 'SELECT ID, Vehicle, Date_Inspected, Inspection_Status from inspections where vehicle = ?';
    console.log(query);
    db.query(query, [req.params.number], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET inspection details for specific vehicle for admin. */
router.get('/inspection/:id', function(req, res, next) {
    var query = 'SELECT * from inspections where ID = ?';
    console.log(query);
    db.query(query, [req.params.id], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET inspection details for specific vehicle for admin. */
router.get('/inspections/:number', function(req, res, next) {
    var query = 'SELECT * from inspections where vehicle = ?';
    console.log(query);
    db.query(query, [req.params.number, req.params.date], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET specific vehicle by inspector */
router.get('/inspected-by/:inspector', function(req, res, next) {
    var query = 'SELECT * from vehicles where inspector =?';
    db.query(query, [req.params.inspector] ,function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            async.forEach(results, function(k, cb){
                //k.image = 'goal';
                var path = 'files/'+k.Number_Plate+'/';
                //console.log(k);
                if (fs.existsSync(path)){
                    fs.readdir(path, function (err, files){
                        var obj = {};
                        console.log(path+': Exists, hence image');
                        async.forEach(files, function (file, callback){
                            let part = file.split('.')[0].split('_')[1];
                            obj[part] = path+file;
                            k.images = obj;
                            callback();
                        }, function(data){
                            array.push(k);
                            cb();
                        });
                    })	;
                }
                else {
                    console.log(path+': Doesnt Exist, no image');
                    k.images = "No Image";
                    array.push(k);
                    cb();
                }

            }, function(data){
                res.send(JSON.stringify({"status": 200, "error": null, "response": array}))
                //If there is no error, all is good and response is 200OK.
            });
        }
    });
});

/* GET specific vehicle by make */
router.get('/vehicle/:make', function(req, res, next) {
    var query = 'SELECT * from vehicles where make =?';
    db.query(query, [req.params.make] ,function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            async.forEach(results, function(k, cb){
                //k.image = 'goal';
                var path = 'files/'+k.Number_Plate+'/';
                //console.log(k);
                if (fs.existsSync(path)){
                    fs.readdir(path, function (err, files){
                        var obj = {};
                        console.log(path+': Exists, hence image');
                        async.forEach(files, function (file, callback){
                            let part = file.split('.')[0].split('_')[1];
                            obj[part] = path+file;
                            k.images = obj;
                            callback();
                        }, function(data){
                            array.push(k);
                            cb();
                        });
                    })	;
                }
                else {
                    console.log(path+': Doesnt Exist, no image');
                    k.images = "No Image";
                    array.push(k);
                    cb();
                }

            }, function(data){
                res.send(JSON.stringify({"status": 200, "error": null, "response": array}))
                //If there is no error, all is good and response is 200OK.
            });
        }
    });
});

/* GET Car Makes */
router.get('/vehicle-makes', function(req, res, next) {
    var query = 'SELECT distinct(make) from vehiclemakes';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET Car Models */
router.get('/models/:make', function(req, res, next) {
    var query = 'SELECT distinct(model) from vehiclemakes where make =?';
    db.query(query, [req.params.make], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET Cumulative Valuation Report */
router.get('/cum-report/', function(req, res, next) {
    var query = 'select sum(Admin_FirstSale_Value) as admin_first, sum(Admin_Market_Valuation) as admin_market, sum(FirstSale_Value) as first, sum(Market_Valuation) as market from inspections';
    db.query(query, [req.params.make], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(results);
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET Cumulative Valuation Report */
router.get('/mf-report/', function(req, res, next) {
    var query = 'select ID, FirstSale_Value, Market_Valuation, Admin_FirstSale_Value, Admin_Market_Valuation, Date_Inspected '+
        'from inspections '+
        'where FirstSale_Value <> 0 and Market_Valuation <> 0 and Admin_FirstSale_Value <> 0 and Admin_Market_Valuation <> 0 and Date_Inspected <> 0 and '+
        'FirstSale_Value is not null and Market_Valuation is not null and Admin_FirstSale_Value is not null and Admin_Market_Valuation is not null and Date_Inspected is not null';
    db.query(query, [req.params.make], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(results);
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET modules.html listing for admin. */
router.get('/modules', function(req, res, next) {
    var query = 'SELECT * from modules order by menu_name asc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.get('/mains/', function(req, res, next) {
    var query = "SELECT * from modules where menu_name = 'Main Menu'";
    db.query(query, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/* GET permissions for each role*/
router.get('/permissions/:id', function(req, res, next) {
    var query = 'select *, (select module_name from modules m where m.id = permissions.module_id) as module, (select menu_name from modules ms where ms.module_name = module) as menu_name from permissions where role_id = ? and date = (select max(date) from permissions where role_id = ?);'
    db.query(query, [req.params.id, req.params.id], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify(results));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

/*Update Vehicle Details*/
router.post('/editVehicle/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    // var payload =  [postData.license, postData.license_original, postData.ecmr, postData.ecmr_original, postData.proof_ownership, postData.proof_ownership_original,
    //                 postData.road_worthiness, postData.road_worthiness_original, postData.insurance_clearance, postData.insurance_clearance_original, postData.custom_clearance, postData.custom_clearance_original,
    //                 postData.purchase_receipt, postData.purchase_receipt_ownership, postData.tinted_permit, postData.tinted_permit_original, postData.number_plates, postData.number_plates_original,
    //                 postData.plate_number_allocation, postData.plate_number_allocation_original, postData.spare_key_available, postData.vehicle_tracker, postData.vehicle_security, Date.now(), np];
    // var query = 'Update vehicles SET '+
    //                 'number_plate=?, make=?, model=?, color=?, year = ?, bought_condition=?, '+
    //                 'engine_capacity=?, transmission=?, mileage=?, fuel_type=?, location = ?, registered_city=?, '+
    //                 'valuation=?, status=?, vehicle_type=?, date_registered=?, registered_by = ?, date_modified=?'+
    //             'where number_plate=?';
    payload = [postData.Mileage, postData.Number_Plate, postData.Price, postData.owner, postData.Make, postData.Model, postData.Color, postData.Year, postData.Bought_Condition, postData.Transmission, postData.Fuel_Type, postData.Engine_Capacity, postData.Registered_City, postData.Location, req.params.id];
    var query = 'update vehicles set Mileage = ?, Number_Plate =?, Price = ?, owner = ?, Make = ?, Model = ?, Color = ?, Year = ?, Bought_Condition = ?, Transmission = ?, Fuel_Type = ?, Engine_Capacity = ?, Registered_City = ?, Location = ? ' +
        'where id = ?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Vehicle Details Updated!"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/brakes/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload = [postData.brake_pads, postData.discs, postData.parking_hand, postData.brakes_ok, Date_Modified, id];

    var query = 'Update inspections SET brake_pads=?, discs=?, parking_hand=?, brakes_ok=?, date_modified=? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Brake Info Updated"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/ac_heater/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload = [postData.cooling, postData.blower, postData.ac_fan, postData.condensor, postData.compressor, postData.ac_no_repair_history, Date_Modified, id];
    var query = 'Update inspections SET cooling=?, blower=?, ac_fan=?, condensor=?, compressor = ?, ac_no_repair_history=?, date_modified=? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Air Conditioner / Heater Info Updated"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/steeringControls/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.lights_lever, postData.washer_lever, postData.wind_screen_lever, postData.wind_screen_lever, postData.steering_wheel, postData.horn, postData.volume_control, postData.temperature_control, postData.phone_dial_control, Date_Modified, id];
    var query = 'Update inspections SET '+
        'cooling=?, blower=?, ac_fan=?, condensor=?, compressor = ?, ac_no_repair_history=?, date_modified=? '+
        'where id=?';

    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Steering Controls Info Updated"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/engineCheck/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var np = req.params.number_plate;
    var payload =  [postData.wires, postData.hoses, postData.belt, postData.pulley, postData.head_gasket, postData.engine_noise, postData.engine_mount,
        postData.gear_mount, postData.radiator_fan, postData.radiator, postData.suction_fan, postData.starter_operation,
        postData.engine_vibration, postData.engine_worked_on, postData.engine_misfire, postData.tappet_sound, postData.knock_sound, postData.overheating_history,
        postData.coolant_reservoir, postData.engine_sludge, postData.engine_smoke, postData.engine_likely_smoke, Date_Modified, id];
    var query = 'Update inspections SET '+
        'wires=?, hoses=?, belt=?, pulley=?, head_gasket = ?, engine_noise=?, '+
        'engine_mount=?, gear_mount=?, radiator_fan=?, radiator=?, suction_fan = ?, starter_operation=?, '+
        'engine_vibration=?, engine_worked_on=?, engine_misfire=?, tappet_sound=?, knock_sound = ?, overheating_history=?, '+
        'coolant_reservoir=?, engine_sludge=?, engine_smoke=?, engine_likely_smoke=?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Engine Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/mirrors/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.right_mirror, postData.left_mirror, postData.right_mirror_control, postData.left_mirror_control, postData.right_mirror_broken, postData.left_mirror_broken, Date_Modified, id];
    var query = 'Update inspections SET '+
        'right_mirror=?, left_mirror=?, right_mirror_control=?, left_mirror_control=?, right_mirror_broken = ?, left_mirror_broken=?, date_modified=?'+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Mirrors Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/electricals/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.battery_terminals, postData.battery_charging, postData.battery_malfunction_indicator, postData.battery_present, postData.tampered_wiring_harness, Date_Modified, id];
    var query = 'Update inspections SET '+
        'battery_terminals=?, battery_charging=?, battery_malfunction_indicator=?, battery_present=?, tampered_wiring_harness=?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Electrical Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/upholstery/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.roof_upholstery, postData.floor_upholstery, postData.door_upholstery, postData.clean_dashboard, postData.sunshades, postData.boot_carpet, postData.boot_board,
        postData.driver_seat_upholstery, postData.passenger_seat_upholstery, postData.rear_seat_upholstery, Date_Modified, id];
    var query = 'Update inspections SET '+
        'roof_upholstery=?, floor_upholstery=?, door_upholstery=?, clean_dashboard=?, sunshades = ?, boot_carpet=?, '+
        'boot_board=?, driver_seat_upholstery=?, passenger_seat_upholstery=?, rear_seat_upholstery=?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Upholstery Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/dashboard/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.dashboard_lights, postData.interior_lights, postData.dashboard_control_ac, postData.dashboard_control_defog, postData.dashboard_control_hazard_lights, postData.dashboard_control_parking_button, postData.audio,
        postData.video, postData.cigarette_lighter, postData.fuelcap_release_lever, postData.bonnet_release_lever, Date_Modified, id];
    var query = 'Update inspections SET '+
        'dashboard_lights=?, interior_lights=?, dashboard_control_ac=?, dashboard_control_defog=?, dashboard_control_hazard_lights = ?, dashboard_control_parking_button=?, '+
        'audio=?, video=?, cigarette_lighter=?, fuelcap_release_lever=?, bonnet_release_lever = ?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Dashboard Info Updated!"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/mechanical-check/:id', function(req, res, next) {
    var postData = req.body;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.trunk_lock, postData.front_door_fitting_rh, postData.front_door_fitting_lh, postData.rear_door_fitting_rh, postData.rear_door_fitting_lh, postData.front_door_levers_rh,
        postData.front_door_levers_lh, postData.rear_door_levers_rh, postData.rear_door_levers_lh, postData.front_windshield, postData.rear_windshield,
        postData.front_door_window_rh, postData.front_door_window_lh, postData.rear_door_window_rh, postData.rear_door_window_lh, postData.underbody_shields, postData.fender_shields,
        postData.front_spoiler, postData.rear_spoiler, Date_Modified, id];
    var query = 'Update inspections SET '+
        'trunk_lock=?, front_door_fitting_rh=?, front_door_fitting_lh=?, rear_door_fitting_rh=?, rear_door_fitting_lh = ?, front_door_levers_rh=?, '+
        'front_door_levers_lh=?, rear_door_levers_rh=?, rear_door_levers_lh=?, front_windshield=?, rear_windshield = ?, front_door_window_rh = ?, '+
        'front_door_window_lh = ?, rear_door_window_rh = ?, rear_door_window_lh = ?, underbody_shields = ?, fender_shields = ?, front_spoiler = ?, '+
        'rear_spoiler = ?, date_modified=? '+
        'where id=?';

    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Mechanical Components Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/equipment/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload = [postData.tools, postData.jack, postData.jack_handle, postData.wheel_spanner, postData.caution_sign, Date_Modified, id];
    var query = 'Update inspections SET tools=?, jack=?, jack_handle=?, wheel_spanner=?, caution_sign=?, date_modified=? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Car Equipment Updated"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/exhaust-check/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.exhaust_sound, postData.exhaust_joint, postData.catalytic_converter, postData.exhaust_leakage, postData.exhaust_pipe_oil_trace, Date_Modified, id];
    var query = 'Update inspections SET '+
        'exhaust_sound=?, exhaust_joint=?, catalytic_converter=?, exhaust_leakage=?, exhaust_pipe_oil_trace = ?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Engine Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/transmission/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.gear_not_converted, postData.gear_delay, postData.gear_surge, postData.gear_repair_history, postData.gear_jerk, postData.fwd_active, Date_Modified, id];
    var query = 'Update inspections SET '+
        'gear_not_converted=?, gear_delay=?, gear_surge=?, gear_repair_history=?, gear_jerk = ?, fwd_active=?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Transmission Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/suspension-steering/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.ball_joints, postData.zlinks, postData.front_brushes, postData.front_shocks, postData.tie_rod, postData.rack_end, postData.rear_brushes,
        postData.rear_shocks, postData.height_control, postData.height_control_unit, Date_Modified, id];
    var query = 'Update inspections SET '+
        'ball_joints=?, zlinks=?, front_brushes=?, front_shocks=?, tie_rod = ?, rack_end=?, '+
        'rear_brushes=?, rear_shocks=?, height_control=?, height_control_unit=?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Suspension - Steering Info Updated!"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/exterior-lights/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.right_headlight, postData.left_headlight, postData.right_taillight, postData.left_taillight, postData.reverse_light, postData.fog_lights, Date_Modified, id];
    var query = 'Update inspections SET '+
        'right_headlight=?, left_headlight=?, right_taillight=?, left_taillight=?, reverse_light = ?, fog_lights=?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "message": results, "response": "Exterior Lights Info Updated!", "payload": payload});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/body-frame/:number_plate', function(req, res, next) {
    var postData = req.body;
    postData.Date_Inspected = Date.now(); //moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    postData.Vehicle = req.params.number_plate;
    var np = req.params.number_plate;
    var payload =  [postData.radiator_core_support, postData.right_strut_tower_apron, postData.left_strut_tower_apron, postData.right_front_rail, postData.left_front_rail, postData.cowl_panel_firewall,
        postData.rightA_pillar, postData.leftA_pillar, postData.rightB_pillar, postData.leftB_pillar, postData.rightC_pillar, postData.leftC_pillar,
        postData.rightD_pillar, postData.leftD_pillar, postData.right_rear_lock_pillar, postData.left_rear_lock_pillar, postData.boot_floor, postData.boot_lock_pillar,
        postData.engraved, postData.converted, postData.accident_history, postData.roof, postData.bonnet, postData.rocker_panel_lh, postData.rocker_panel_rh, postData.chassis, Date.now(), np];
    var query = 'insert into inspections set ?';
    db.query(query, postData,  function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            db.query('SELECT * from inspections where ID = (select max(ID) from inspections)', function(err, re, fields) {
                if (!err){
                    res.send({"status": 200, "error": null, "response": re[0]});
                }
                else{
                    res.send(JSON.stringify({"status": 500, "response": "Error retrieving inspection details. Please re-do Body-frame inspection!"}));
                }
            });
            //res.send(JSON.stringify({"status": 200, "error": null, "response": "Body - Frame Info Updated!"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/windows-central-lock/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.rightF_window_lever, postData.leftF_window_lever, postData.rightR_window_lever, postData.leftR_window_lever, postData.autolock,
        postData.window_safety_lock, postData.auto_window_mech, postData.manual_window_mech, Date_Modified, id];
    var query = 'Update inspections SET '+
        'rightF_window_lever=?, leftF_window_lever=?, rightR_window_lever=?, leftR_window_lever=?, autolock = ?, window_safety_lock=?, '+
        'auto_window_mech=?, manual_window_mech=?, date_modified=? where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Exterior Lights Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/seats/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.right_seat_adjuster_recliner, postData.left_seat_adjuster_recliner, postData.right_seat_adjuster_lear_track, postData.left_seat_adjuster_lear_track, postData.seat_adjuster_tracker, postData.right_seat_belt, postData.left_seat_belt,
        postData.rear_seat_belt, postData.head_rest, postData.arm_rest, postData.glove_box, Date_Modified, id];
    var query = 'Update inspections SET '+
        'right_seat_adjuster_recliner=?, left_seat_adjuster_recliner=?, right_seat_adjuster_lear_track=?, left_seat_adjuster_lear_track=?, seat_adjuster_tracker = ?, right_seat_belt=?, '+
        'left_seat_belt=?, rear_seat_belt=?, head_rest=?, arm_rest=?, glove_box=?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Seats Info Updated!"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/obd/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.crank_shaft_sensor, postData.camshaft_sensor, postData.oxygen_sensor, postData.map_sensor, postData.throttle_position_sensor, postData.coolant_sensor,
        postData.airflow_sensor, postData.tpms, postData.evap, postData.abs, postData.srs, postData.bcm,
        postData.pcm, postData.detonation_sensor, postData.egr_sensor, postData.vehicle_speed, postData.gear_solenoid, postData.catalyst_sensor,
        postData.throttle_sensor, postData.mil, Date_Modified, id];
    var query = 'Update inspections SET '+
        'crank_shaft_sensor=?, camshaft_sensor=?, oxygen_sensor=?, map_sensor=?, throttle_position_sensor = ?, coolant_sensor=?, '+
        'airflow_sensor=?, tpms=?, evap=?, abs=?, srs = ?, bcm=?, '+
        'pcm=?, detonation_sensor=?, egr_sensor=?, vehicle_speed=?, gear_solenoid = ?, catalyst_sensor=?, '+
        'throttle_sensor=?, mil=?, date_modified=? '+
        'where id=?';

    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "OBD Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/fluids-filters/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.engine_oil, postData.oilpump_leakage, postData.engine_oil_valve_cover, postData.axle_oil_leakage, postData.gear_oil_leakage, postData.gear_oil_seal,
        postData.gear_oil, postData.brake_oil, postData.brake_oil_leakage, postData.brake_oil_hose_leakage, postData.brake_caliper, postData.brake_oil_pipe_leakage,
        postData.power_steering_oil_gauge, postData.power_steering_oil, postData.power_steering, postData.power_steering_oil_pump, postData.power_steering_oil_leakage, postData.washer_fluid,
        postData.washer_fluid_leakage, postData.washer_fluid_compartment, Date_Modified, id];
    var query = 'Update inspections SET '+
        'engine_oil=?, oilpump_leakage=?, engine_oil_valve_cover=?, axle_oil_leakage=?, gear_oil_leakage = ?, gear_oil_seal=?, '+
        'gear_oil=?, brake_oil=?, brake_oil_leakage=?, brake_oil_hose_leakage=?, brake_caliper = ?, brake_oil_pipe_leakage=?, '+
        'power_steering_oil_gauge=?, power_steering_oil=?, power_steering=?, power_steering_oil_pump=?, power_steering_oil_leakage = ?, washer_fluid=?, '+
        'washer_fluid_leakage=?, washer_fluid_compartment=?, date_modified=? '+
        'where id=?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Fluids and Filter Info Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/documentation/:id', function(req, res, next) {
    var postData = req.body;
    var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var payload =  [postData.license, postData.license_original, postData.ecmr, postData.ecmr_original, postData.proof_ownership, postData.proof_ownership_original,
        postData.road_worthiness, postData.road_worthiness_original, postData.insurance_clearance, postData.insurance_clearance_original, postData.custom_clearance, postData.custom_clearance_original,
        postData.purchase_receipt, postData.purchase_receipt_ownership, postData.tinted_permit, postData.tinted_permit_original, postData.number_plates, postData.number_plates_original,
        postData.plate_number_allocation, postData.plate_number_allocation_original, postData.spare_key_available, postData.vehicle_tracker, postData.vehicle_security, Date_Modified, id];
    var query = 'Update inspections SET '+
        'license=?, license_original=?, ecmr=?, ecmr_original=?, proof_ownership = ?, proof_ownership_original=?, '+
        'road_worthiness=?, road_worthiness_original=?, insurance_clearance=?, insurance_clearance_original=?, custom_clearance = ?, custom_clearance_original=?, '+
        'purchase_receipt=?, purchase_receipt_ownership=?, tinted_permit=?, tinted_permit_original=?, number_plates = ?, number_plates_original=?, '+
        'plate_number_allocation=?, plate_number_allocation_original=?, spare_key_available=?, vehicle_tracker=?, vehicle_security=?, date_modified=? '+
        'where id=?';
    postData.Vehicle = req.params.number_plate;
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Vehicle Documentation Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/valuation/:number_plate', function(req, res, next) {
    var postData = req.body;
    //var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = Date.now(); //moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var Vehicle = req.params.number_plate;
    var payload = [postData.firstsale_value, postData.market_valuation, Date_Modified, req.params.number_plate];
    var query = 'update inspections set FirstSale_Value = ?, Market_Valuation = ?, Date_Modified = ? where ID = ?';
    var query1 = 'select max(ID) as ID from inspections where vehicle = ?';
    db.query(query1, req.params.number_plate, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            db.query(query, [postData.firstsale_value, postData.market_valuation, Date_Modified, results[0]['ID']], function (error, results, fields) {
                if(error){
                    res.send({"status": 500, "error": error, "response": null});
                    //If there is error, we send the error in the error section with 500 status
                } else {
                    res.send({"status": 200, "error": null, "response": "Vehicle Valuation Details Updated!"});
                    //If there is no error, all is good and response is 200OK.
                }
            });
        }
    });
});

router.post('/admin-valuation/:id', function(req, res, next) {
    var postData = req.body;
    //var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var Vehicle = req.params.number_plate;
    var payload = [postData.Admin_FirstSale_Value, postData.Admin_Market_Valuation, Date_Modified, id];
    var query = 'update inspections set Admin_FirstSale_Value = ?, Admin_Market_Valuation = ?, Date_Modified = ? where ID = ?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Vehicle Valuation Details Updated!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/inspection-approval/:id/:status/:reason', function(req, res, next) {
    var postData = req.body;
    //var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var Vehicle = req.params.number_plate;
    var payload = [req.params.status, id];
    var query = 'update inspections set Inspection_Status = ?, Reason_For_Reject = ?, Date_Modified = ? where ID = ?';
    db.query(query, [req.params.status, req.params.reason, Date_Modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Inspection Approved!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/reject-inspection/:id/', function(req, res, next) {
    var postData = req.body;
    //var np = req.params.number_plate;
    var id = req.params.id;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    var Vehicle = req.params.number_plate;
    //var payload = [postData.Admin_FirstSale_Value, postData.Admin_Market_Valuation, Date_Modified, id];
    var query = 'update inspections set Inspection_Status = 0, Date_Modified = ? where ID = ?';
    db.query(query, [Date_Modified, id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send({"status": 200, "error": null, "response": "Inspection Rejected!"});
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/maintenance/', function(req, res, next) {
    var data = req.body;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    data.Date = Date_Modified;

    var query = 'insert into maintenance set ?';
    db.query(query, [data], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "Maintenance Information Updated!"}));
        }
    });
});

//File Upload - Vehicle Maintenance
router.post('/maintenance-upload/:number_plate/', function(req, res) {
    console.log(req)
    if (!req.files) return res.status(400).send('No files were uploaded.');
    if (!req.params) return res.status(400).send('No Number Plate specified!');
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.file;
    let name = sampleFile.name;
    let extArray = sampleFile.name.split(".");
    let extension = extArray[extArray.length - 1];
    let fileName = name+'.'+extension;

    fs.stat('files/'+req.params.number_plate+'/', function(err) {
        if (err.code === 'ENOENT') {
            fs.mkdirSync('files/'+req.params.number_plate+'/');
        }
    });

    fs.stat('files/'+req.params.number_plate+'/maintenance.'+extension, function (err) {

        if (err) {
            sampleFile.mv('files/'+req.params.number_plate+'/maintenance.'+extension, function(err) {
                if (err) return res.status(500).send(err);
                res.send('File uploaded!');
            });
        }
        else{
            fs.unlink('files/'+req.params.number_plate+'/maintenance.'+extension,function(err){
                if(err){
                    res.send('Unable to delete file!');
                }
                else{
                    sampleFile.mv('files/'+req.params.number_plate+'/maintenance.'+extension, function(err) {
                        if (err)
                            return res.status(500).send(err);

                        res.send('File uploaded!');
                    });
                }
            });
        }

    });
});

router.post('/workflows', function(req, res, next) {
    let count = 0,
        stages = req.body.stages,
        workflow = req.body.workflow,
        date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    workflow.date_created = date_created;

    db.getConnection(function(err, connection) {
        if (err) throw err;

        connection.query('INSERT INTO workflows SET ?', workflow, function (error, response, fields) {
            if(error || !response)
                res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            connection.query('SELECT * FROM workflows WHERE ID = LAST_INSERT_ID()', function (error, results, fields) {
                async.forEach(stages, function (stage, callback) {
                    stage.workflowID = results[0]['ID'];
                    stage.date_created = date_created;
                    delete stage.stage_name;
                    delete stage.type;
                    if (stage.action_names)
                        delete stage.action_names;
                    connection.query('INSERT INTO workflow_stages SET ?', stage, function (error, results, fields) {
                        if (error){
                            console.log(error);
                        } else {
                            count++;
                        }
                        callback();
                    });
                }, function (data) {
                    connection.query('SELECT * FROM workflows AS w WHERE w.status <> 0 ORDER BY w.ID desc', function (error, results, fields) {
                        connection.release();
                        res.send({"status": 200, "error": null, "message": "Workflow with "+count+" stage(s) created successfully!", "response": results});
                    });
                })
            })
        });
    });
});

router.get('/workflows', function(req, res, next) {
    let query = 'SELECT * FROM workflows AS w WHERE w.status <> 0 ORDER BY w.ID desc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Workflows fetched successfully!", "response": results});
        }
    });
});

router.get('/workflow-stages', function(req, res, next) {
    let query = 'SELECT w.ID, w.document, w.actions, w.workflowID, w.stageID, w.name, w.description, w.date_created, w.date_modified, s.name AS stage_name FROM workflow_stages AS w, stages as s WHERE w.stageID=s.ID ORDER BY w.ID asc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Workflows fetched successfully!", "response": results});
        }
    });
});

router.get('/workflow-stages/:workflow_id', function(req, res, next) {
    let query = 'SELECT w.ID, w.document, w.actions, w.workflowID, w.stageID, w.name, w.description, w.date_created, w.date_modified, s.name AS stage_name FROM workflow_stages AS w, stages as s WHERE w.workflowID =? AND w.stageID=s.ID ORDER BY w.ID asc';
    db.query(query, [req.params.workflow_id], function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Workflows fetched successfully!", "response": results});
        }
    });
});

router.get('/stages', function(req, res, next) {
    let query = 'SELECT * from stages ORDER BY name asc';
    db.query(query, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send(results);
        }
    });
});

router.post('/stages', function(req, res, next) {
    let stage = req.body,
        query = 'INSERT INTO stages SET ?';
    stage.type = 2;
    db.query(query, stage, function (error, results, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else {
            res.send({"status": 200, "message": "Stage added successfully!", "response": results});
        }
    });
});

router.post('/submitPermission/:role', function(req, res, next) {
    var ids = req.body;
    var role_id = ids.role;
    var count = 0;
    var status = true;
    db.getConnection(function(err, connection) {
        if (err) throw err;

        async.forEach(ids.modules, function (id, callback) {
            var module_id = id[0]
            var read_only = id[1];
            var write = id[2];
            var query = 'INSERT INTO permissions SET ?';
            connection.query(query, {role_id:role_id, module_id:module_id, read_only:read_only, editable:write, date:moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a')}, function (error, results, fields) {
                if(error){
                    status = false;
                    callback({"status": 500, "error": error, "response": null});
                } else {
                    console.log("Permissions for module "+module_id+ " added!");
                    count++;
                }
                callback();
            });
        }, function (data) {
            connection.release();
            if(status === false)
                return res.send(data);
            res.send({"status": 200, "error": null, "message": "Permissions Set for Selected Role!"});
        })
    });
});

router.post('/new-module/', function(req, res, next) {
    var data = req.body;

    var query = 'insert into modules set ?';
    db.query(query, [data], function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "New Module Added!"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.post('/update-module/:id', function(req, res, next) {
    var data = req.body;
    var Date_Modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    data.Date = Date_Modified;
    var payload = [data.module_name, data.menu_name, data.status, data.main_menu]
    var query = 'update modules set module_name = ?, menu_name = ?, status = ?, main_menu = ? where id = ?';
    db.query(query, payload, function (error, results, fields) {
        if(error){
            res.send(JSON.stringify({"status": 500, "error": error, "response": null}));
            //If there is error, we send the error in the error section with 500 status
        } else {
            res.send(JSON.stringify({"status": 200, "error": null, "response": "New Module Added!"}));
            //If there is no error, all is good and response is 200OK.
        }
    });
});

router.get('/document-upload/:id/:name?', function(req, res) {
    res.send('OK');
});

router.post('/document-upload/:id/:name', function(req, res) {
    let	name = req.params.name,
        application_id = req.params.id;

    if (!name) return res.status(400).send('No files were uploaded.');
    if (!req.files) return res.status(400).send('No files were uploaded.');
    if (!req.params || !application_id || !name) return res.status(400).send('No parameters specified!');
    let sampleFile = req.files['files[]'],
        extArray = sampleFile.name.split("."),
        extension = extArray[extArray.length - 1];

    db.query('SELECT * FROM applications WHERE ID = ?', [application_id], function (error, application, fields) {
        if(error){
            res.send({"status": 500, "error": error, "response": null});
        } else if (!application || !application[0]) {
            res.send({"status": 500, "error": "Application does not exist", "response": null});
        } else {
            fs.stat('files/application-'+application_id+'/', function(err) {
                if (!err) {
                    console.log('file or directory exists');
                } else if (err.code === 'ENOENT') {
                    fs.mkdirSync('files/application-'+application_id+'/');
                }
            });

            fs.stat('files/application-'+application_id+'/'+application_id+'_'+name+'.'+extension, function (err) {
                if (err) {
                    sampleFile.mv('files/application-'+application_id+'/'+application_id+'_'+name+'.'+extension, function(err) {
                        if (err) return res.status(500).send(err);
                        res.send({files:[sampleFile]});
                    });
                }
                else{
                    fs.unlink('files/application-'+application_id+'/'+application_id+'_'+name+'.'+extension,function(err){
                        if(err){
                            return console.log(err);
                        } else{
                            sampleFile.mv('files/application-'+application_id+'/'+application_id+'_'+name+'.'+extension, function(err) {
                                if (err)
                                    return res.status(500).send(err);
                                res.send({files:[sampleFile]});
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/document_check/:id/:name', function(req, res, next) {
    let obj = {},
        status = false,
        path = 'files/application-'+req.params.id+'/';
    if (fs.existsSync(path)){
        fs.readdir(path, function (err, files){
            async.forEach(files, function (file, callback){
                let filename_array = file.split('.')[0].split('_');
                filename_array.shift();
                let filename = filename_array.join('_');
                if (filename === req.params.name)
                    status = true;
                obj[filename] = path+file;
                callback();
            }, function(data){
                res.json({status:status, response:obj});
            });
        });
    }
    else {
        res.json({status:status});
    }
});

module.exports = router;