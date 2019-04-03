let functions = {},
    db = require('./db'),
    request = require('request'),
    SHA512 = require('js-sha512');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

functions.getNextWorkflowProcess = function(application_id, workflow_id, stage, callback) {
    db.query('SELECT * FROM workflow_stages WHERE workflowID=? ORDER BY ID asc',[workflow_id], function (error, stages, fields) {
        if(stages){
            stages.push({name:"Denied",stageID:4,stage_name:"Denied",workflowID:workflow_id,approverID:1});
            if(application_id && !stage){
                db.query('SELECT * FROM workflow_processes WHERE ID = (SELECT MAX(ID) FROM workflow_processes WHERE applicationID=? AND status=1)',[application_id], function (error, application_last_process, fields) {
                    if (application_last_process){
                        let next_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(application_last_process[0]['next_stage'])),
                            current_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(application_last_process[0]['current_stage']));
                        if (stages[next_stage_index+1]){
                            if (application_last_process[0]['next_stage'] !== stages[next_stage_index+1]['stageID']){//current stage must not be equal to next stage
                                callback({previous_stage:application_last_process[0]['current_stage'],current_stage:application_last_process[0]['next_stage'],next_stage:stages[next_stage_index+1]['stageID'], approver_id:stages[current_stage_index]['approverID']});
                            } else {
                                if (stages[next_stage_index+2]){
                                    callback({previous_stage:application_last_process[0]['current_stage'],current_stage:application_last_process[0]['next_stage'],next_stage:stages[next_stage_index+2]['stageID'], approver_id:stages[current_stage_index]['approverID']});
                                } else {
                                    callback({previous_stage:application_last_process[0]['current_stage'],current_stage:application_last_process[0]['next_stage'], approver_id:stages[current_stage_index]['approverID']});
                                }
                            }
                        } else {
                            callback({previous_stage:application_last_process[0]['current_stage'],current_stage:application_last_process[0]['next_stage'], approver_id:stages[current_stage_index]['approverID']});
                        }
                    } else {
                        callback({});
                    }
                });
            } else if(application_id && stage){
                let previous_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(stage['previous_stage'])),
                    current_stage_index = stages.map(function(e) { return e.stageID; }).indexOf(parseInt(stage['current_stage'])),
                    next_stage_index = current_stage_index+1;
                if (stage['next_stage']){
                    callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stage['next_stage'], approver_id:stages[previous_stage_index]['approverID']});
                }else if (stages[next_stage_index]){
                    if (stage['current_stage'] !== stages[next_stage_index]['stageID']){
                        callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stages[next_stage_index]['stageID'], approver_id:stages[previous_stage_index]['approverID']});
                    } else {
                        if (stages[next_stage_index+1]){
                            callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'],next_stage:stages[next_stage_index+1]['stageID'], approver_id:stages[previous_stage_index]['approverID']});
                        } else {
                            callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'], approver_id:stages[previous_stage_index]['approverID']});
                        }
                    }
                } else {
                    callback({previous_stage:stage['previous_stage'],current_stage:stage['current_stage'], approver_id:stages[previous_stage_index]['approverID']});
                }
            } else {
                callback({current_stage:stages[0]['stageID'],next_stage:stages[1]['stageID']});
            }
        } else {
            callback({})
        }
    });
};

functions.formatJSONP = function (body) {
    const jsonpData = body;
    let json;
    try
    {
        json = JSON.parse(jsonpData);
    }
    catch(e)
    {
        const startPos = jsonpData.indexOf('({'),
            endPos = jsonpData.indexOf('})'),
            jsonString = jsonpData.substring(startPos+1, endPos+1);
        json = JSON.parse(jsonString);
    }
    return json;
};

functions.setUpMandate = function (payload, callback) {
    let date = new Date();
    payload.merchantId = process.env.REMITA_MERCHANT_ID;
    payload.serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID;
    payload.requestId = date.getTime();
    payload.hash = SHA512(payload.merchantId + payload.serviceTypeId + payload.requestId + payload.amount + process.env.REMITA_API_KEY);
    request.post(
        {
            url: `${process.env.REMITA_BASE_URL}/setup`,
            body: payload,
            json: true
        },
        (error, res, body) => {
            if (error) {
                return callback(error);
            }
            callback(payload, functions.formatJSONP(body));
    })
};

module.exports = functions;