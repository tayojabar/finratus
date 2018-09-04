var express = require('express');
var router = express.Router();
var db = require('../db');

/* Add New Vehicle */
router.post('/addVehicle', function(req, res, next) {
	var postData = req.body;  
	payload = [];
    var query =  'INSERT INTO vehicles Set ?';
	db.query(query,postData, function (error, results, fields) {
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

/* GET specific vehicle by id */
router.get('/vehicles/:number_plate', function(req, res, next) {
    var query = 'SELECT * from vehicles where number_plate =?';
	db.query(query, [req.params.number_plate] ,function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/* GET specific vehicle by owner */
router.get('/vehicles/:owner', function(req, res, next) {
    var query = 'SELECT * from vehicles where owner =?';
	db.query(query, [req.params.owner] ,function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
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
  			res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

/* GET specific vehicle by make */
router.get('/vehicles/:make', function(req, res, next) {
    var query = 'SELECT * from vehicles where make =?';
	db.query(query, [req.params.make] ,function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  			//If there is no error, all is good and response is 200OK.
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

/*Update Vehicle Details*/
router.post('/editVehicle/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.license, postData.license_original, postData.ecmr, postData.ecmr_original, postData.proof_ownership, postData.proof_ownership_original, 
                    postData.road_worthiness, postData.road_worthiness_original, postData.insurance_clearance, postData.insurance_clearance_original, postData.custom_clearance, postData.custom_clearance_original, 
                    postData.purchase_receipt, postData.purchase_receipt_ownership, postData.tinted_permit, postData.tinted_permit_original, postData.number_plates, postData.number_plates_original,
                    postData.plate_number_allocation, postData.plate_number_allocation_original, postData.spare_key_available, postData.vehicle_tracker, postData.vehicle_security, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'number_plate=?, make=?, model=?, color=?, year = ?, bought_condition=?, '+
                    'engine_capacity=?, transmission=?, mileage=?, fuel_type=?, location = ?, registered_city=?, '+
                    'valuation=?, status=?, vehicle_type=?, date_registered=?, registered_by = ? '+
                'where number_plate=?';
    
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

router.post('/brakes/:number_plate', function(req, res, next) {
    var postData = req.body;  
    var payload = [postData.brake_pads, postData.discs, postData.parking_hand, postData.brakes_ok, postData.number_plate];
    var query = 'Update vehicles SET brake_pads=?, discs=?, parking_hand=?, brakes_ok=? where number_plate=?';
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

router.post('/ac_heater/:number_plate', function(req, res, next) {
    var postData = req.body;    
    var payload = [postData.cooling, postData.blower, postData.ac_fan, postData.condensor, postData.compressor, postData.ac_no_repair_history, postData.number_plate];
    var query = 'Update vehicles SET cooling=?, blower=?, ac_fan=?, condensor=?, compressor = ?, ac_no_repair_history=? where number_plate=?';
	db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Air Conditioner / Heater Info Updated"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/steeringControls/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.lights_lever, postData.washer_lever, postData.wind_screen_lever, postData.wind_screen_lever, postData.steering_wheel, postData.horn, postData.volume_control, postData.temperature_control, postData.phone_dial_control, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'cooling=?, blower=?, ac_fan=?, condensor=?, compressor = ?, ac_no_repair_history=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Steering Controls Info Updated"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/engineCheck/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.wires, postData.hoses, postData.belt, postData.pulley, postData.head_gasket, postData.engine_noise, postData.engine_mount, 
                    postData.gear_mount, postData.radiator_fan, postData.radiator, postData.suction_fan, postData.starter_operation, 
                    postData.engine_vibration, postData.engine_worked_on, postData.engine_misfire, postData.tappet_sound, postData.knock_sound, postData.overheating_history,
                    postData.coolant_reservoir, postData.engine_sludge, postData.engine_smoke, postData.engine_likely_smoke, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'wires=?, hoses=?, belt=?, pulley=?, head_gasket = ?, engine_noise=?, '+
                    'engine_mount=?, gear_mount=?, radiator_fan=?, radiator=?, suction_fan = ?, starter_operation=?, '+
                    'engine_vibration=?, engine_worked_on=?, engine_misfire=?, tappet_sound=?, knock_sound = ?, overheating_history=?, '+
                    'coolant_reservoir=?, engine_sludge=?, engine_smoke=?, engine_likely_smoke=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Engine Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/mirrors/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.right_mirror, postData.left_mirror, postData.right_mirror_control, postData.left_mirror_control, postData.right_mirror_broken, postData.left_mirror_broken, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'right_mirror=?, left_mirror=?, right_mirror_control=?, left_mirror_control=?, right_mirror_broken = ?, left_mirror_broken=?'+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Mirrors Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/electricals/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.battery_terminals, postData.battery_charging, postData.battery_malfunction_indicator, postData.battery_present, postData.tampered_wiring_harness, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'battery_terminals=?, battery_charging=?, battery_malfunction_indicator=?, battery_present=?, tampered_wiring_harness=?, '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Electrical Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/upholstery/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.roof_upholstery, postData.floor_upholstery, postData.door_upholstery, postData.clean_dashboard, postData.sunshades, postData.boot_carpet, postData.boot_board, 
                    postData.driver_seat_upholstery, postData.passenger_seat_upholstery, postData.rear_seat_upholstery, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'roof_upholstery=?, floor_upholstery=?, door_upholstery=?, clean_dashboard=?, sunshades = ?, boot_carpet=?, '+
                    'boot_board=?, driver_seat_upholstery=?, passenger_seat_upholstery=?, rear_seat_upholstery=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Upholstery Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/dashboard/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.dashboard_lights, postData.interior_lights, postData.dashboard_control_ac, postData.dashboard_control_defog, postData.dashboard_control_hazard_lights, postData.dashboard_control_parking_button, postData.audio, 
                    postData.video, postData.cigarette_lighter, postData.fuel_cap_release_lever, postData.bonnet_release_lever, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'dashboard_lights=?, interior_lights=?, dashboard_control_ac=?, dashboard_control_defog=?, dashboard_control_hazard_lights = ?, dashboard_control_parking_button=?, '+
                    'audio=?, video=?, cigarette_lighter=?, fuel_cap_release_lever=?, bonnet_release_lever = ? '+
                'where number_plate=?';
    
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

router.post('/mechanical-check/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.trunk_lock, postData.front_door_fitting_rh, postData.front_door_fitting_lh, postData.rear_door_fitting_rh, postData.rear_door_fitting_lh, postData.front_door_levers_rh, 
                    postData.front_door_levers_lh, postData.rear_door_levers_rh, postData.rear_door_levers_lh, postData.front_windshield, postData.rear_windshield, 
                    postData.front_door_window_rh, postData.front_door_window_lh, postData.rear_door_window_rh, postData.rear_door_window_lh, postData.underbody_shields, postData.fender_shields, 
                    postData.front_spoiler, postData.rear_spoiler, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'trunk_lock=?, front_door_fitting_rh=?, front_door_fitting_lh=?, rear_door_fitting_rh=?, rear_door_fitting_lh = ?, front_door_levers_rh=?, '+
                    'front_door_levers_lh=?, rear_door_levers_rh=?, rear_door_levers_lh=?, front_windshield=?, rear_windshield = ?, front_door_window_rh = ? '+
                    ', front_door_window_lh = ?, rear_door_window_rh = ?, rear_door_window_lh = ?, underbody_shields = ?, fender_shields = ?, front_spoiler = ? '+
                    'rear_spoiler = ? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Mechanical Components Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/equipment/:number_plate', function(req, res, next) {
    var postData = req.body;  
    var payload = [postData.tools, postData.jack, postData.jack_handle, postData.wheel_spanner, postData.caution_sign, postData.number_plate];
    var query = 'Update vehicles SET tools=?, jack=?, jack_handle=?, wheel_spanner=?, caution_sign=?, where number_plate=?';
	db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Car Equipment Updated"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/exhaust-check/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.exhaust_sound, postData.exhaust_joint, postData.catalytic_converter, postData.exhaust_leakage, postData.exhaust_pipe_oil_trace, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'exhaust_sound=?, exhaust_joint=?, catalytic_converter=?, exhaust_leakage=?, exhaust_pipe_oil_trace = ? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Engine Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/transmission/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.gear_not_converted, postData.gear_delay, postData.gear_surge, postData.gear_repair_history, postData.gear_jerk, postData.fwd_active, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'gear_not_converted=?, gear_delay=?, gear_surge=?, gear_repair_history=?, gear_jerk = ?, 4wd_active=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Transmission Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/suspension-steering/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.ball_joints, postData.zlinks, postData.front_brushes, postData.front_shocks, postData.tie_rod, postData.rack_end, postData.rear_brushes, 
                    postData.rear_shocks, postData.height_control, postData.height_control_unit, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'ball_joints=?, zlinks=?, front_brushes=?, front_shocks=?, tie_rod = ?, rack_end=?, '+
                    'rear_brushes=?, rear_shocks=?, height_control=?, height_control_unit=? '+
                'where number_plate=?';
    
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

router.post('/exterior-lights/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.right_headlight, postData.left_headlight, postData.right_taillight, postData.left_taillight, postData.reverse_light, postData.fog_lights, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'right_headlight=?, left_headlight=?, right_taillight=?, left_taillight=?, reverse_light = ?, fog_lights=?, '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Exterior Lights Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/body-frame/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.radiator_core_support, postData.right_strut_tower_apron, postData.left_strut_tower_apron, postData.right_front_rail, postData.left_front_rail, postData.cowl_panel_firewall, 
                    postData.rightA_pillar, postData.leftA_pillar, postData.rightB_pillar, postData.leftB_pillar, postData.rightC_pillar, postData.leftC_pillar, 
                    postData.rightD_pillar, postData.leftD_pillar, postData.right_rear_lock_pillar, postData.left_rear_lock_pillar, postData.boot_floor, postData.boot_lock_pillar,
                    postData.engraved, postData.converted, postData.accident_history, postData.roof, postData.bonnet, postData.rocker_panel_lh, postData.rocker_panel_rh, postData.chassis, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'radiator_core_support=?, right_strut_tower_apron=?, left_strut_tower_apron=?, right_front_rail=?, left_front_rail = ?, cowl_panel_firewall=?, '+
                    'rightA_pillar=?, leftA_pillar=?, rightB_pillar=?, leftB_pillar=?, rightC_pillar = ?, leftC_pillar=?, '+
                    'rightD_pillar=?, leftD_pillar=?, right_rear_lock_pillar=?, left_rear_lock_pillar=?, boot_floor = ?, boot_lock_pillar=?, '+
                    'engraved=?, converted=?, accident_history=?, roof=?, bonnet=?, rocker_panel_lh=?, rocker_panel_rh=?, chassis=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Body - Frame Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/windows-central-lock/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.right_headlight, postData.left_headlight, postData.right_taillight, postData.left_taillight, postData.reverse_light, postData.fog_lights, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'rightF_window_lever=?, leftF_window_lever=?, rightR_window_lever=?, leftR_window_lever=?, autolock = ?, window_safety_lock=?, '+
                    'right_headlight=?, left_headlight=?, right_taillight=?, left_taillight=?, reverse_light = ?, fog_lights=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Exterior Lights Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/seats/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.right_seat_adjuster_recliner, postData.left_seat_adjuster_recliner, postData.right_seat_adjuster_lear_track, postData.left_seat_adjuster_lear_track, postData.seat_adjuster_tracker, postData.right_seat_belt, postData.left_seat_belt, 
                    postData.rear_seat_belt, postData.head_rest, postData.arm_rest, postData.glove_box, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'right_seat_adjuster_recliner=?, left_seat_adjuster_recliner=?, right_seat_adjuster_lear_track=?, left_seat_adjuster_lear_track=?, seat_adjuster_tracker = ?, right_seat_belt=?, '+
                    'left_seat_belt=?, rear_seat_belt=?, head_rest=?, arm_rest=?, glove_box=? '+
                'where number_plate=?';
    
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

router.post('/obd/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.crank_shaft_censor, postData.camshaft_sensor, postData.oxygen_sensor, postData.map_sensor, postData.throttle_position_sensor, postData.coolant_sensor, 
                    postData.airflow_sensor, postData.tpms, postData.evap, postData.abs, postData.srs, postData.bcm, 
                    postData.pcm, postData.detonation_sensor, postData.egr_sensor, postData.vehicle_speed, postData.gear_solenoid, postData.catalyst_sensor,
                    postData.throttle_sensor, postData.mil, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'crank_shaft_censor=?, camshaft_sensor=?, oxygen_sensor=?, map_sensor=?, throttle_position_sensor = ?, coolant_sensor=?, '+
                    'airflow_sensor=?, tpms=?, evap=?, abs=?, srs = ?, bcm=?, '+
                    'pcm=?, detonation_sensor=?, egr_sensor=?, vehicle_speed=?, gear_solenoid = ?, catalyst_sensor=?, '+
                    'throttle_sensor=?, mil=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "OBD Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/fluids-filters/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.engine_oil, postData.oilpump_leakage, postData.engine_oil_valve_cover, postData.axe_oil_leakage, postData.gear_oil_leakage, postData.gear_oil_seal, 
                    postData.gear_oil, postData.brake_oil, postData.brake_oil_leakage, postData.brake_oil_hose_leakage, postData.brake_caliper, postData.brake_oil_pipe_leakage, 
                    postData.power_steering_oil_gauge, postData.power_steering_oil, postData.power_steering, postData.power_steering_oil_pump, postData.power_steering_oil_leakage, postData.washer_fluid,
                    postData.washer_fluid_leakage, postData.washer_fluid_compartment, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'engine_oil=?, oilpump_leakage=?, engine_oil_valve_cover=?, axe_oil_leakage=?, gear_oil_leakage = ?, gear_oil_seal=?, '+
                    'gear_oil=?, brake_oil=?, brake_oil_leakage=?, brake_oil_hose_leakage=?, brake_caliper = ?, brake_oil_pipe_leakage=?, '+
                    'power_steering_oil_gauge=?, power_steering_oil=?, power_steering=?, power_steering_oil_pump=?, power_steering_oil_leakage = ?, washer_fluid=?, '+
                    'washer_fluid_leakage=?, washer_fluid_compartment=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Fluids and Filter Info Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

router.post('/documentation/:number_plate', function(req, res, next) {
    var postData = req.body;   
    var payload =  [postData.license, postData.license_original, postData.ecmr, postData.ecmr_original, postData.proof_ownership, postData.proof_ownership_original, 
                    postData.road_worthiness, postData.road_worthiness_original, postData.insurance_clearance, postData.insurance_clearance_original, postData.custom_clearance, postData.custom_clearance_original, 
                    postData.purchase_receipt, postData.purchase_receipt_ownership, postData.tinted_permit, postData.tinted_permit_original, postData.number_plates, postData.number_plates_original,
                    postData.plate_number_allocation, postData.plate_number_allocation_original, postData.spare_key_available, postData.vehicle_tracker, postData.vehicle_security, postData.number_plate];
    var query = 'Update vehicles SET '+
                    'license=?, license_original=?, ecmr=?, ecmr_original=?, proof_ownership = ?, proof_ownership_original=?, '+
                    'road_worthiness=?, road_worthiness_original=?, insurance_clearance=?, insurance_clearance_original=?, custom_clearance = ?, custom_clearance_original=?, '+
                    'purchase_receipt=?, purchase_receipt_ownership=?, tinted_permit=?, tinted_permit_original=?, number_plates = ?, number_plates_original=?, '+
                    'plate_number_allocation=?, plate_number_allocation_original=?, spare_key_available=?, vehicle_tracker=?, vehicle_security=? '+
                'where number_plate=?';
    
    db.query(query, payload, function (error, results, fields) {
	  	if(error){
	  		res.send(JSON.stringify({"status": 500, "error": error, "response": null})); 
	  		//If there is error, we send the error in the error section with 500 status
	  	} else {
  			res.send(JSON.stringify({"status": 200, "error": null, "response": "Vehicle Documentation Updated!"}));
  			//If there is no error, all is good and response is 200OK.
	  	}
  	});
});

module.exports = router;