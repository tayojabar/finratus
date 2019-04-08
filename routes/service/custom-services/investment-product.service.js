const express = require('express');
const axios = require('axios');
const router = express.Router();
const moment = require('moment');

//Get Investment Product
router.get('/all', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let page = ((req.query.page - 1) * 10 < 0) ? 0 : (req.query.page - 1) * 10;
    let search_string = (req.query.search_string === undefined) ? "" : req.query.search_string.toUpperCase();
    let query = `SELECT ID,name,code,investment_max,investment_min,min_term,max_term FROM investment_products WHERE status = 1 AND (upper(code) LIKE "${search_string}%" OR upper(name) LIKE "${search_string}%") ORDER BY ID desc LIMIT ${limit} OFFSET ${page}`;
    const endpoint = "/core-service/get";
    const url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send(err);
        })
        .catch(function (error) {
            res.send(error);
        });
});

router.get('/roles', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let page = ((req.query.page - 1) * 10 < 0) ? 0 : (req.query.page - 1) * 10;
    let search_string = (req.query.search_string === undefined) ? "" : req.query.search_string.toUpperCase();
    let query = `SELECT ID,role_name FROM user_roles WHERE status = 1 AND upper(role_name) LIKE "${search_string}%" ORDER BY ID desc LIMIT ${limit} OFFSET ${page}`;
    const endpoint = "/core-service/get";
    const url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send(err);
        })
        .catch(function (error) {
            res.send(error);
        });
});


router.get('/get-products', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let draw = req.query.draw;
    let order = req.query.order;
    let status = req.query.status;
    let qStatus = (status === undefined) ? "" : `status = ${status} AND`;
    let search_string = req.query.search_string.toUpperCase();
    let query = `SELECT ID,name,code,investment_max,investment_min,interest_rate,status, date_created 
    FROM investment_products  WHERE ${qStatus} code LIKE "${search_string}%" OR name LIKE "${search_string}%" 
    ${order} LIMIT ${limit} OFFSET ${offset}`;
    let endpoint = '/core-service/get';
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
        params: {
            query: query
        }
    }).then(response => {
        query = `SELECT count(*) AS recordsTotal, (SELECT count(*) FROM investment_products 
        WHERE  status = 1 AND code LIKE "${search_string}%" OR name LIKE "${search_string}%") as recordsFiltered FROM investment_products`;
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

router.post('/requirements', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    var data = req.body
    data.createdDate = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `INSERT INTO investment_product_requirements SET ?`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/requirements/:id', function (req, res, next) {
    let HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let draw = req.query.draw;
    let order = req.query.order;
    let search_string = req.query.search_string.toUpperCase();
    let color = ["badge-primary", "badge-secondary", "badge-success", "badge-danger", "badge-warning", "badge-info", "badge-light", "badge-dark"];
    let query = `SELECT ID, operationId,roleId,isAllRoles,priority FROM investment_product_requirements WHERE status = 1 AND productId = ${req.params.id} AND 
    (operationId LIKE "${search_string}%" OR roleId LIKE "${search_string}%") ${order} LIMIT ${limit} OFFSET ${offset}`;
    let endpoint = "/core-service/get";
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            let roles = [];
            if (response.data.length > 0) {
                response.data.forEach((x, index) => {
                    x.roles = [];
                    x.htmlTag = "";
                    x.roleId = JSON.parse(x.roleId);
                    x.priority = JSON.parse(x.priority);
                    x.roleId.forEach((r, index2) => {
                        query = `SELECT ID,role_name FROM user_roles WHERE id = ${r}`;
                        endpoint = "/core-service/get";
                        url = `${HOST}${endpoint}`;
                        axios.get(url, {
                                params: {
                                    query: query
                                }
                            })
                            .then(function (response2) {
                                x.roles.push({
                                    id: response2.data[0].ID,
                                    name: response2.data[0].role_name
                                });

                                let rand = Math.floor(Math.random() * 8) + 1;
                                let badgeColor = (color[index2] !== undefined && color[index2] !== null) ? color[index2] : color[rand];
                                x.htmlTag = x.htmlTag + `<span class="badge badge-pill ${badgeColor}">${response2.data[0].role_name}</span>`
                                if (index === (response.data.length - 1)) {
                                    query = `SELECT count(*) AS recordsTotal, (SELECT count(*) FROM investment_product_requirements WHERE status AND productId = ${req.params.id} AND 
                                    (operationId LIKE "${search_string}%" OR roleId LIKE "${search_string}%")) as recordsFiltered FROM investment_product_requirements`;
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
                                    }, err => {
                                        res.send({
                                            draw: draw,
                                            recordsTotal: 0,
                                            recordsFiltered: 0,
                                            data: []
                                        });
                                    });
                                }
                            });
                    });
                });
            } else {
                res.send({
                    draw: draw,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: []
                });
            }

        }, err => {
            res.send({
                draw: draw,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
            });
        })
        .catch(function (error) {
            res.send({
                draw: draw,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
            });
        });
});

router.post('/requirements/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let data = req.body
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `UPDATE investment_product_requirements SET isAllRoles = ${data.isAllRoles} , updatedDate = '${dt}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/required-roles', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `SELECT ID, roleId FROM investment_product_requirements WHERE productId = ${req.query.productId} AND 
    operationId = ${req.query.operationId} AND status = 1`;
    let endpoint = "/core-service/get";
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            if (response.data.length > 0) {
                let _roles = [];
                let roleId = JSON.parse(response.data[0].roleId);
                roleId.forEach((r, index) => {
                    query = `SELECT role_name FROM user_roles WHERE id = ${r}`;
                    endpoint = "/core-service/get";
                    url = `${HOST}${endpoint}`;
                    axios.get(url, {
                            params: {
                                query: query
                            }
                        })
                        .then(function (response2) {
                            _roles.push({
                                id: r,
                                text: response2.data[0].role_name,
                                reqId: response.data[0].ID
                            })
                            // const item = r;
                            // roleId[index] = {};
                            // roleId[index].id = item;
                            // roleId[index].name = response2.data[0].role_name;
                            // _roles.push(roleId[index]);
                            if (_roles.length === roleId.length) {
                                res.send(_roles);
                            }
                        }, err => {
                            res.send([]);
                        });
                });
            } else {
                res.send([]);
            }
        }, err => {
            res.send([]);
        })
        .catch(function (error) {
            res.send([]);
        });
});

router.post('/update-requirements/:id', function (req, res, next) {
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    data = req.body;
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `UPDATE investment_product_requirements SET roleId =${JSON.stringify(data.roleId)}, updatedDate ='${dt.toString()}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/remove-requirements/:id', function (req, res, next) {
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `UPDATE investment_product_requirements SET status = 0, updatedDate ='${dt.toString()}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/get`;
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.post('/update-approval/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let data = req.body
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `UPDATE investment_product_requirements SET priority = '${data.priority}' , updatedDate = '${dt}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});



router.post('/reviews', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    var data = req.body;
    data.createdDate = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `INSERT INTO investment_product_reviews SET ?`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/reviews/:id', function (req, res, next) {
    let HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let draw = req.query.draw;
    let order = req.query.order;
    let search_string = req.query.search_string.toUpperCase();
    let color = ["badge-primary", "badge-secondary", "badge-success", "badge-danger", "badge-warning", "badge-info", "badge-light", "badge-dark"];
    let query = `SELECT ID, operationId,roleId,isAllRoles,priority FROM investment_product_reviews WHERE status = 1 AND productId = ${req.params.id} AND 
    (operationId LIKE "${search_string}%" OR roleId LIKE "${search_string}%") ${order} LIMIT ${limit} OFFSET ${offset}`;
    let endpoint = "/core-service/get";
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            let roles = [];
            if (response.data.length > 0) {
                response.data.forEach((x, index) => {
                    x.roles = [];
                    x.htmlTag = "";
                    x.roleId = JSON.parse(x.roleId);
                    x.priority = JSON.parse(x.priority);
                    x.roleId.forEach((r, index2) => {
                        query = `SELECT ID,role_name FROM user_roles WHERE id = ${r}`;
                        endpoint = "/core-service/get";
                        url = `${HOST}${endpoint}`;
                        axios.get(url, {
                                params: {
                                    query: query
                                }
                            })
                            .then(function (response2) {
                                x.roles.push({
                                    id: response2.data[0].ID,
                                    name: response2.data[0].role_name
                                });

                                let rand = Math.floor(Math.random() * 8) + 1;
                                let badgeColor = (color[index2] !== undefined && color[index2] !== null) ? color[index2] : color[rand];
                                x.htmlTag = x.htmlTag + `<span class="badge badge-pill ${badgeColor}">${response2.data[0].role_name}</span>`
                                if (index === (response.data.length - 1)) {
                                    query = `SELECT count(*) AS recordsTotal, (SELECT count(*) FROM investment_product_reviews WHERE status AND productId = ${req.params.id} AND 
                                    (operationId LIKE "${search_string}%" OR roleId LIKE "${search_string}%")) as recordsFiltered FROM investment_product_reviews`;
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
                                    }, err => {
                                        res.send({
                                            draw: draw,
                                            recordsTotal: 0,
                                            recordsFiltered: 0,
                                            data: []
                                        });
                                    });
                                }
                            });
                    });
                });
            } else {
                res.send({
                    draw: draw,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: []
                });
            }

        }, err => {
            res.send({
                draw: draw,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
            });
        })
        .catch(function (error) {
            res.send({
                draw: draw,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
            });
        });
});

router.post('/reviews/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let data = req.body
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `UPDATE investment_product_reviews SET isAllRoles = ${data.isAllRoles} , updatedDate = '${dt}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/required-review-roles', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `SELECT ID, roleId FROM investment_product_reviews WHERE productId = ${req.query.productId} AND 
    operationId = ${req.query.operationId} AND status = 1`;
    let endpoint = "/core-service/get";
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            if (response.data.length > 0) {
                let _roles = [];
                let roleId = JSON.parse(response.data[0].roleId);
                roleId.forEach((r, index) => {
                    query = `SELECT role_name FROM user_roles WHERE id = ${r}`;
                    endpoint = "/core-service/get";
                    url = `${HOST}${endpoint}`;
                    axios.get(url, {
                            params: {
                                query: query
                            }
                        })
                        .then(function (response2) {
                            _roles.push({
                                id: r,
                                text: response2.data[0].role_name,
                                reqId: response.data[0].ID
                            })
                            // const item = r;
                            // roleId[index] = {};
                            // roleId[index].id = item;
                            // roleId[index].name = response2.data[0].role_name;
                            // _roles.push(roleId[index]);
                            if (_roles.length === roleId.length) {
                                res.send(_roles);
                            }
                        }, err => {
                            res.send([]);
                        });
                });
            } else {
                res.send([]);
            }
        }, err => {
            res.send([]);
        })
        .catch(function (error) {
            res.send([]);
        });
});

router.post('/update-reviews/:id', function (req, res, next) {
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    data = req.body;
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `UPDATE investment_product_reviews SET roleId =${JSON.stringify(data.roleId)}, updatedDate ='${dt.toString()}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/remove-reviews/:id', function (req, res, next) {
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `UPDATE investment_product_reviews SET status = 0, updatedDate ='${dt.toString()}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/get`;
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.post('/update-review-priority/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let data = req.body
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `UPDATE investment_product_reviews SET priority = '${data.priority}' , updatedDate = '${dt}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});




router.post('/posts', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    var data = req.body;
    data.createdDate = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `INSERT INTO investment_product_posts SET ?`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/posts/:id', function (req, res, next) {
    let HOST = `${req.protocol}://${req.get('host')}`;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let draw = req.query.draw;
    let order = req.query.order;
    let search_string = req.query.search_string.toUpperCase();
    let color = ["badge-primary", "badge-secondary", "badge-success", "badge-danger", "badge-warning", "badge-info", "badge-light", "badge-dark"];
    let query = `SELECT ID, operationId,roleId,isAllRoles,priority FROM investment_product_posts WHERE status = 1 AND productId = ${req.params.id} AND 
    (operationId LIKE "${search_string}%" OR roleId LIKE "${search_string}%") ${order} LIMIT ${limit} OFFSET ${offset}`;
    let endpoint = "/core-service/get";
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            let roles = [];
            if (response.data.length > 0) {
                response.data.forEach((x, index) => {
                    x.roles = [];
                    x.htmlTag = "";
                    x.roleId = JSON.parse(x.roleId);
                    x.priority = JSON.parse(x.priority);
                    x.roleId.forEach((r, index2) => {
                        query = `SELECT ID,role_name FROM user_roles WHERE id = ${r}`;
                        endpoint = "/core-service/get";
                        url = `${HOST}${endpoint}`;
                        axios.get(url, {
                                params: {
                                    query: query
                                }
                            })
                            .then(function (response2) {
                                x.roles.push({
                                    id: response2.data[0].ID,
                                    name: response2.data[0].role_name
                                });

                                let rand = Math.floor(Math.random() * 8) + 1;
                                let badgeColor = (color[index2] !== undefined && color[index2] !== null) ? color[index2] : color[rand];
                                x.htmlTag = x.htmlTag + `<span class="badge badge-pill ${badgeColor}">${response2.data[0].role_name}</span>`
                                if (index === (response.data.length - 1)) {
                                    query = `SELECT count(*) AS recordsTotal, (SELECT count(*) FROM investment_product_posts WHERE status AND productId = ${req.params.id} AND 
                                    (operationId LIKE "${search_string}%" OR roleId LIKE "${search_string}%")) as recordsFiltered FROM investment_product_posts`;
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
                                    }, err => {
                                        res.send({
                                            draw: draw,
                                            recordsTotal: 0,
                                            recordsFiltered: 0,
                                            data: []
                                        });
                                    });
                                }
                            });
                    });
                });
            } else {
                res.send({
                    draw: draw,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: []
                });
            }

        }, err => {
            res.send({
                draw: draw,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
            });
        })
        .catch(function (error) {
            res.send({
                draw: draw,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
            });
        });
});

router.post('/post/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let data = req.body
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `UPDATE investment_product_posts SET isAllRoles = ${data.isAllRoles} , updatedDate = '${dt}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/required-post-roles', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `SELECT ID, roleId FROM investment_product_posts WHERE productId = ${req.query.productId} AND 
    operationId = ${req.query.operationId} AND status = 1`;
    let endpoint = "/core-service/get";
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            if (response.data.length > 0) {
                let _roles = [];
                let roleId = JSON.parse(response.data[0].roleId);
                roleId.forEach((r, index) => {
                    query = `SELECT role_name FROM user_roles WHERE id = ${r}`;
                    endpoint = "/core-service/get";
                    url = `${HOST}${endpoint}`;
                    axios.get(url, {
                            params: {
                                query: query
                            }
                        })
                        .then(function (response2) {
                            _roles.push({
                                id: r,
                                text: response2.data[0].role_name,
                                reqId: response.data[0].ID
                            })
                            // const item = r;
                            // roleId[index] = {};
                            // roleId[index].id = item;
                            // roleId[index].name = response2.data[0].role_name;
                            // _roles.push(roleId[index]);
                            if (_roles.length === roleId.length) {
                                res.send(_roles);
                            }
                        }, err => {
                            res.send([]);
                        });
                });
            } else {
                res.send([]);
            }
        }, err => {
            res.send([]);
        })
        .catch(function (error) {
            res.send([]);
        });
});

router.post('/update-posts/:id', function (req, res, next) {
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    data = req.body;
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `UPDATE investment_product_posts SET roleId =${JSON.stringify(data.roleId)}, updatedDate ='${dt.toString()}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.get('/remove-posts/:id', function (req, res, next) {
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    const HOST = `${req.protocol}://${req.get('host')}`;
    let query = `UPDATE investment_product_posts SET status = 0, updatedDate ='${dt.toString()}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/get`;
    let url = `${HOST}${endpoint}`;
    axios.get(url, {
            params: {
                query: query
            }
        })
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

router.post('/update-post-priority/:id', function (req, res, next) {
    const HOST = `${req.protocol}://${req.get('host')}`;
    let data = req.body
    let dt = moment().utcOffset('+0100').format('YYYY-MM-DD h:mm:ss a');
    let query = `UPDATE investment_product_posts SET priority = '${data.priority}' , updatedDate = '${dt}' WHERE ID =${req.params.id}`;
    let endpoint = `/core-service/post?query=${query}`;
    let url = `${HOST}${endpoint}`;
    axios.post(url, data)
        .then(function (response) {
            res.send(response.data);
        }, err => {
            res.send({
                status: 500,
                error: err,
                response: null
            });
        })
        .catch(function (error) {
            res.send({
                status: 500,
                error: error,
                response: null
            });
        });
});

module.exports = router;