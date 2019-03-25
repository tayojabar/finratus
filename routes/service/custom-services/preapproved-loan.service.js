const
    axios = require('axios'),
    moment = require('moment'),
    bcrypt = require('bcryptjs'),
    express = require('express'),
    router = express.Router(),
    nodemailer = require('nodemailer'),
    helperFunctions = require('../../../helper-functions'),
    hbs = require('nodemailer-express-handlebars'),
    smtpTransport = require('nodemailer-smtp-transport'),
    smtpConfig = smtpTransport({
        service: 'Mailjet',
        auth: {
            user: process.env.MAILJET_KEY,
            pass: process.env.MAILJET_SECRET
        }
    }),
    options = {
        viewPath: 'views/email',
        extName: '.hbs'
    };
transporter = nodemailer.createTransport(smtpConfig);
transporter.use('compile', hbs(options));

router.get('/recommendations/get', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let draw = req.query.draw;
    let order = req.query.order;
    let query =
        `SELECT 
            apps.userID, 
            count(a.ID) AS invoices_due, 
            (SELECT sum(duration) FROM applications WHERE status = 2 AND userID = apps.userID) AS duration, 
            ((SELECT sum(duration) FROM applications WHERE status = 2 AND userID = apps.userID) -count(a.ID)) AS months_left,
            round(sum(apps.loan_amount)/count(apps.ID),2) as average_loan,
            (SELECT c.salary FROM clients c WHERE c.ID = apps.userID) AS salary, 
            (SELECT c.salary FROM clients c WHERE c.ID = apps.userID)*6 AS salary_loan, 
            sum((CASE
                WHEN (SELECT sum(s.payment_amount) FROM schedule_history s WHERE s.status=1  
                AND s.payment_date=a.payment_collect_date AND s.invoiceID = a.ID) IS NULL THEN 1
            ELSE
                0
            END)) AS defaults,
            (SELECT c.fullname FROM clients c WHERE c.ID = apps.userID) AS client,
            round((1-(round((sum((CASE
                            WHEN (SELECT sum(s.payment_amount) FROM schedule_history s WHERE s.status=1 
                            AND s.payment_date=a.payment_collect_date AND s.invoiceID = a.ID) IS NULL THEN 1
                        ELSE
                            0
                        END))
                    /count(a.ID)),2))
                )*100
            ,0) AS credit_score,
            round((CASE
                    WHEN ((SELECT c.salary FROM clients c WHERE c.ID = apps.userID)*6) > (round(sum(apps.loan_amount)/count(apps.ID),2))
                    THEN ((SELECT c.salary FROM clients c WHERE c.ID = apps.userID)*6)
                ELSE
                    (round(sum(apps.loan_amount)/count(apps.ID),2))
                END)
                *(round((1-(sum((CASE
                            WHEN (SELECT sum(s.payment_amount) FROM schedule_history s WHERE s.status=1 
                            AND s.payment_date=a.payment_collect_date AND s.invoiceID = a.ID) IS NULL THEN 1
                        ELSE
                            0
                        END))
                    /count(a.ID))),2))
                ,2) AS loan_amount
        FROM application_schedules a, applications apps WHERE a.status=1 AND apps.status=2 
        AND (SELECT p.ID FROM preapproved_loans p WHERE p.userID = apps.userID) IS NULL 
        AND a.applicationID = apps.ID AND a.payment_collect_date < CURDATE() GROUP BY apps.userID
        ORDER BY round((1-(round((sum((CASE
                            WHEN (SELECT sum(s.payment_amount) FROM schedule_history s WHERE s.status=1 
                            AND s.payment_date=a.payment_collect_date AND s.invoiceID = a.ID) IS NULL THEN 1
                        ELSE
                            0
                        END))
                    /count(a.ID)),2))
                )*100
            ,0) desc LIMIT 20`;
    let endpoint = '/core-service/get';
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
        params: {
            query: query
        }
    }).then(response => {
        query = `SELECT count(distinct(apps.userID)) AS recordsTotal FROM application_schedules a, applications apps 
                 WHERE a.status=1 AND apps.status=2 AND (SELECT p.ID FROM preapproved_loans p WHERE p.userID = apps.userID) IS NULL 
                 AND a.applicationID = apps.ID AND a.payment_collect_date < CURDATE()`;
        endpoint = '/core-service/get';
        url = `${HOST}${endpoint}`;
        axios.get(url, {
            params: {
                query: query
            }
        }).then(payload => {
            res.send({
                draw: draw,
                recordsTotal: payload.data[0].recordsTotal,
                recordsFiltered: payload.data[0].recordsTotal,
                data: (response.data === undefined) ? [] : response.data
            });
        });
    });
});

router.get('/recommendations/get/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `SELECT 
            apps.userID, 
            count(a.ID) AS invoices_due, 
            (SELECT sum(duration) FROM applications WHERE status = 2 AND userID = apps.userID) AS duration, 
            ((SELECT sum(duration) FROM applications WHERE status = 2 AND userID = apps.userID) -count(a.ID)) AS months_left,
            round(sum(apps.loan_amount)/count(apps.ID),2) as average_loan,
            (SELECT c.salary FROM clients c WHERE c.ID = apps.userID) AS salary, 
            (SELECT c.salary FROM clients c WHERE c.ID = apps.userID)*6 AS salary_loan, 
            sum((CASE
                WHEN (SELECT sum(s.payment_amount) FROM schedule_history s WHERE s.status=1  
                AND s.payment_date=a.payment_collect_date AND s.invoiceID = a.ID) IS NULL THEN 1
            ELSE
                0
            END)) AS defaults,
            (SELECT c.fullname FROM clients c WHERE c.ID = apps.userID) AS client,
            round((1-(round((sum((CASE
                            WHEN (SELECT sum(s.payment_amount) FROM schedule_history s WHERE s.status=1 
                            AND s.payment_date=a.payment_collect_date AND s.invoiceID = a.ID) IS NULL THEN 1
                        ELSE
                            0
                        END))
                    /count(a.ID)),2))
                )*100
            ,0) AS credit_score,
            round((CASE
                    WHEN ((SELECT c.salary FROM clients c WHERE c.ID = apps.userID)*6) > (round(sum(apps.loan_amount)/count(apps.ID),2))
                    THEN ((SELECT c.salary FROM clients c WHERE c.ID = apps.userID)*6)
                ELSE
                    (round(sum(apps.loan_amount)/count(apps.ID),2))
                END)
                *(round((1-(sum((CASE
                            WHEN (SELECT sum(s.payment_amount) FROM schedule_history s WHERE s.status=1 
                            AND s.payment_date=a.payment_collect_date AND s.invoiceID = a.ID) IS NULL THEN 1
                        ELSE
                            0
                        END))
                    /count(a.ID))),2))
                ,2) AS loan_amount
        FROM application_schedules a, applications apps WHERE a.status=1 AND apps.status=2 AND (SELECT p.ID FROM preapproved_loans p WHERE p.userID = apps.userID) IS NULL 
        AND a.applicationID = apps.ID AND a.payment_collect_date < CURDATE() AND apps.userID = ${req.params.id}`;
    let endpoint = '/core-service/get';
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
        params: {
            query: query
        }
    }).then(response => {
        res.send({
            data: (response.data === undefined) ? {} : response.data[0]
        });
    });
});

router.post('/create', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let data = {},
        postData = Object.assign({},req.body.application),
        preapproved_loan = Object.assign({},req.body.preapproved_loan),
        query =  'INSERT INTO applications Set ?',
        endpoint = `/core-service/post?query=${query}`,
        url = `${HOST}${endpoint}`;
    delete postData.email;
    delete postData.fullname;
    postData.status = 0;
    postData.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    axios.post(url, postData)
        .then(function (response) {
            query = `SELECT * from applications WHERE ID = (SELECT MAX(ID) from applications)`;
            endpoint = `/core-service/get`;
            url = `${HOST}${endpoint}`;
            axios.get(url, {
                params: {
                    query: query
                }
            }).then(function (response_) {
                query =  'INSERT INTO preapproved_loans Set ?';
                endpoint = `/core-service/post?query=${query}`;
                url = `${HOST}${endpoint}`;
                preapproved_loan.applicationID = response_['data'][0]['ID'];
                preapproved_loan.date_created = postData.date_created;
                preapproved_loan.expiry_date = moment().add(1, 'days').utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
                preapproved_loan.hash = bcrypt.hashSync(postData.userID, parseInt(process.env.SALT_ROUNDS));
                axios.post(url, preapproved_loan)
                    .then(function (response__) {
                        data.name = req.body.fullname;
                        data.date = postData.date_created;
                        data.offer_url = `${HOST}/offer?t=${encodeURIComponent(preapproved_loan.hash)}`;
                        let mailOptions = {
                            from: 'no-reply Loanratus <applications@loan35.com>',
                            to: req.body.email,
                            subject: 'Loanratus Loan Application Offer',
                            template: 'offer',
                            context: data
                        };
                        transporter.sendMail(mailOptions, function(error, info){
                            if(error)
                                return res.send({status: 500, error: error, response: null});
                            return res.send(response_['data'][0]);
                        });
                }, err => {
                    res.send({status: 500, error: error, response: null});
                })
                .catch(function (error) {
                    res.send({status: 500, error: error, response: null});
                });
            }, err => {
                res.send({status: 500, error: error, response: null});
            })
            .catch(function (error) {
                res.send({status: 500, error: error, response: null});
            });
        }, err => {
            res.send({status: 500, error: error, response: null});
        })
        .catch(function (error) {
            res.send({status: 500, error: error, response: null});
        });
});

router.post('/reject', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let preapproved_loan = Object.assign({},req.body.preapproved_loan),
        query =  'INSERT INTO preapproved_loans Set ?',
        endpoint = `/core-service/post?query=${query}`,
        url = `${HOST}${endpoint}`;
    preapproved_loan.status = 0;
    preapproved_loan.date_created = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    axios.post(url, preapproved_loan)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({status: 500, error: error, response: null});
        })
        .catch(function (error) {
            res.send({status: 500, error: error, response: null});
        });
});

router.get('/get', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let draw = req.query.draw;
    let order = req.query.order;
    let search_string = req.query.search_string.toUpperCase();
    let query = `SELECT * FROM preapproved_loans p, (SELECT c.salary FROM clients c WHERE c.ID = p.userID) AS salary 
                 WHERE upper(p.client) LIKE "${search_string}%" OR upper(p.loan_amount) LIKE "${search_string}%" 
                 OR upper(p.credit_score) LIKE "${search_string}%" ${order} LIMIT ${limit} OFFSET ${offset}`;
    let endpoint = '/core-service/get';
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
        params: {
            query: query
        }
    }).then(response => {
        query = `SELECT count(*) AS recordsTotal, (SELECT count(*) FROM preapproved_loans p 
                 WHERE upper(p.client) LIKE "${search_string}%" OR upper(p.loan_amount) LIKE "${search_string}%" 
                 OR upper(p.credit_score) LIKE "${search_string}%") as recordsFiltered FROM preapproved_loans`;
        endpoint = '/core-service/get';
        url = `${HOST}${endpoint}`;
        axios.get(url, {
            params: {
                query: query
            }
        }).then(payload => {
            res.send({
                draw: draw,
                recordsTotal: payload.data[0].recordsTotal,
                recordsFiltered: payload.data[0].recordsFiltered,
                data: (response.data === undefined) ? [] : response.data
            });
        });
    });
});

router.get('/get/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `SELECT *, (SELECT c.email FROM clients c WHERE c.ID = userID) AS email, (SELECT c.salary FROM clients c WHERE c.ID = userID) AS salary 
                FROM preapproved_loans WHERE ID = '${decodeURIComponent(req.params.id)}' OR hash = '${decodeURIComponent(req.params.id)}'`,
        endpoint = '/core-service/get',
        url = `${HOST}${endpoint}`;
    axios.get(url, {
        params: {
            query: query
        }
    }).then(response => {
        if (response['data'][0]){
            query = `SELECT * FROM application_schedules WHERE applicationID = ${response['data'][0]['applicationID']} AND status = 1`;
            endpoint = '/core-service/get';
            url = `${HOST}${endpoint}`;
            axios.get(url, {
                params: {
                    query: query
                }
            }).then(response_ => {
                let preapproved_loan = (response.data === undefined) ? {} : response.data[0];
                preapproved_loan.schedule = (response_.data === undefined) ? [] : response_.data;
                res.send({
                    data: preapproved_loan
                });
            });
        } else {
            res.send({
                data: {}
            });
        }
    });
});

router.get('/delete/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `DELETE FROM preapproved_loans WHERE ID = ${req.params.id}`;
    let endpoint = '/core-service/get';
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
        params: {
            query: query
        }
    }).then(response => {
        res.send({
            data: (response.data === undefined) ? {} : response.data[0]
        });
    });
});

router.post('/offer/accept/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let offer = {},
        id = req.params.id,
        email = req.body.email,
        fullname = req.body.client,
        created_by = req.body.created_by,
        workflow_id = req.body.workflow_id,
        application_id = req.body.application_id,
        date = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a'),
        query =  `UPDATE preapproved_loans Set ? WHERE ID = ${id}`,
        endpoint = `/core-service/post?query=${query}`,
        url = `${HOST}${endpoint}`;
    offer.status = 2;
    offer.date_modified = date;
    axios.post(url, offer)
        .then(function (response) {
            let application = {};
            query =  `UPDATE applications Set ? WHERE ID = ${application_id}`;
            endpoint = `/core-service/post?query=${query}`;
            url = `${HOST}${endpoint}`;
            application.status = 1;
            application.date_modified = date;
            axios.post(url, application)
                .then(function (response_) {
                    let mailOptions = {
                        from: 'no-reply Loanratus <applications@loan35.com>',
                        to: email,
                        subject: 'Loanratus Application Successful',
                        template: 'main',
                        context: {
                            name: fullname,
                            date: date
                        }
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error)
                            res.send({status: 500, error: error, response: null});
                        helperFunctions.getNextWorkflowProcess(false,workflow_id,false, function (process) {
                            query =  'INSERT INTO workflow_processes Set ?';
                            endpoint = `/core-service/post?query=${query}`;
                            url = `${HOST}${endpoint}`;
                            process.workflowID = workflow_id;
                            process.agentID = created_by;
                            process.applicationID = application_id;
                            process.date_created = date;
                            axios.post(url, process)
                                .then(function (response__) {
                                    res.send(response__.data);
                                }, err => {
                                    res.send({status: 500, error: error, response: null});
                                })
                                .catch(function (error) {
                                    res.send({status: 500, error: error, response: null});
                                });
                        });
                    });
                }, err => {
                    res.send({status: 500, error: error, response: null});
                })
                .catch(function (error) {
                    res.send({status: 500, error: error, response: null});
                });
        }, err => {
            res.send({status: 500, error: error, response: null});
        })
        .catch(function (error) {
            res.send({status: 500, error: error, response: null});
        });
});

router.get('/offer/decline/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let offer = {},
        query =  `UPDATE preapproved_loans Set ? WHERE ID = ${req.params.id}`,
        endpoint = `/core-service/post?query=${query}`,
        url = `${HOST}${endpoint}`;
    offer.status = 3;
    offer.date_modified = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    axios.post(url, offer)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({status: 500, error: error, response: null});
        })
        .catch(function (error) {
            res.send({status: 500, error: error, response: null});
        });
});

module.exports = router;