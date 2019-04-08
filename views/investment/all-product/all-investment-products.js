var table = {};
let reqObject = {};
let roleObject = [];
let selectedApproval = {};
let selectedRow = {};
$(document).ready(function () {
    bindDataTable();
});
$(document).ajaxStart(function () {
    $("#wait").css("display", "block");
});

$(document).ajaxComplete(function () {
    $("#wait").css("display", "none");
});

let _table = $('#bootstrap-data-table-export').DataTable();

function updateStatus(id, status) {
    $.ajax({
        url: `/investment/products-status/${id}`,
        'type': 'post',
        'data': {
            status: status
        },
        'success': function (data) {
            if (data.status === 200) {
                $('#wait').hide();
                swal('Investment Product updated successfully!', '', 'success');
                var url = "./all-investment-products";
                $(location).attr('href', url);
            } else {
                $('#wait').hide();
                swal('Oops! An error occurred while updating Investment Product', '', 'error');
            }
        },
        'error': function (err) {
            $('#wait').hide();
            swal('Oops! An error occurred while updating Investment Product', '', 'error');
        }
    });
}

function onCloseDialog() {
    $('#list_user_roles').on('select2:select').val('');
    table2.destroy();
}

function onRequirement(value, id) {
    reqObject.productId = id;
    $("#viewRequirementModalHeader").html(`${value} APPROVAL SETTINGS`);

    $('#list_user_roles').select2({
        allowClear: true,
        placeholder: "Select Role",
        ajax: {
            url: "/investment-products/roles",
            dataType: "json",
            delay: 250,
            data: function (params) {
                params.page = (params.page === undefined || params.page === null) ? 0 : params.page;
                return {
                    limit: 10,
                    page: params.page,
                    search_string: params.term
                };
            },
            processResults: function (data, params) {
                params.page = params.page || 1;
                if (data.error) {
                    return {
                        results: []
                    };
                } else {
                    return {
                        results: data.map(function (item) {
                            return {
                                id: item.ID,
                                text: item.role_name
                            };
                        }),
                        pagination: {
                            more: params.page * 10
                        }
                    };
                }
            },
            cache: true
        }
    });
    getProductRequirement(id);
}

function onReview(value, id) {
    reqObject.productId = id;
    $("#viewReviewModalHeader").html(`${value} REVIEWER SETTINGS`);

    $('#list_review_roles').select2({
        allowClear: true,
        placeholder: "Select Role",
        ajax: {
            url: "/investment-products/roles",
            dataType: "json",
            delay: 250,
            data: function (params) {
                params.page = (params.page === undefined || params.page === null) ? 0 : params.page;
                return {
                    limit: 10,
                    page: params.page,
                    search_string: params.term
                };
            },
            processResults: function (data, params) {
                params.page = params.page || 1;
                if (data.error) {
                    return {
                        results: []
                    };
                } else {
                    return {
                        results: data.map(function (item) {
                            return {
                                id: item.ID,
                                text: item.role_name
                            };
                        }),
                        pagination: {
                            more: params.page * 10
                        }
                    };
                }
            },
            cache: true
        }
    });
    getProductReview(id);
}

function onPost(value, id) {
    reqObject.productId = id;
    $("#viewPostModalHeader").html(`${value} POST SETTINGS`);
    $('#list_post_roles').select2({
        allowClear: true,
        placeholder: "Select Role",
        ajax: {
            url: "/investment-products/roles",
            dataType: "json",
            delay: 250,
            data: function (params) {
                params.page = (params.page === undefined || params.page === null) ? 0 : params.page;
                return {
                    limit: 10,
                    page: params.page,
                    search_string: params.term
                };
            },
            processResults: function (data, params) {
                params.page = params.page || 1;
                if (data.error) {
                    return {
                        results: []
                    };
                } else {
                    return {
                        results: data.map(function (item) {
                            return {
                                id: item.ID,
                                text: item.role_name
                            };
                        }),
                        pagination: {
                            more: params.page * 10
                        }
                    };
                }
            },
            cache: true
        }
    });
    getProductPost(id);
}

function bindDataTable() {
    table = $('#product-data-table').DataTable({
        dom: 'Blfrtip',
        bProcessing: true,
        bServerSide: true,
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        fnServerData: function (sSource, aoData, fnCallback) {
            let tableHeaders = [{
                    name: "Status",
                    query: `ORDER BY ID desc`
                }, {
                    name: "code",
                    query: `ORDER BY ID desc`
                },
                {
                    name: "name",
                    query: `ORDER BY name ${aoData[2].value[0].dir}`
                },
                {
                    name: "interest_rate",
                    query: `ORDER BY CAST(REPLACE(interest_rate, ',', '') AS DECIMAL) ${aoData[2].value[0].dir}`
                },
                {
                    name: "investment_min",
                    query: `ORDER BY CAST(REPLACE(investment_min, ',', '') AS DECIMAL) ${aoData[2].value[0].dir}`
                },
                {
                    name: "investment_max",
                    query: `ORDER BY CAST(REPLACE(investment_max, ',', '') AS DECIMAL) ${aoData[2].value[0].dir}`
                },
                {
                    name: "date_created",
                    query: `ORDER BY STR_TO_DATE(date_created, '%Y-%m-%d') ${aoData[2].value[0].dir}`
                }, {
                    name: "status",
                    query: `ORDER BY status ${aoData[2].value[0].dir}`
                }
            ];
            $.ajax({
                dataType: 'json',
                type: "GET",
                url: `/investment-products/get-products`,
                data: {
                    limit: aoData[4].value,
                    offset: aoData[3].value,
                    draw: aoData[0].value,
                    search_string: aoData[5].value.value,
                    order: tableHeaders[aoData[2].value[0].column].query
                },
                success: function (data) {
                    fnCallback(data)
                }
            });
        },
        aoColumnDefs: [{
            sClass: "numericCol",
            aTargets: [3, 4, 5],
            sType: "numeric"
        }],
        columns: [{
                width: "15%",
                "mRender": function (data, type, full) {
                    return `<span class="badge badge-pill ${(full.status===1)?'badge-primary':'badge-danger'}">${(full.status===1)?'Active':'Inactive'}</span>`;
                }
            },
            {
                data: "code",
                width: "15%"
            },
            {
                data: "name",
                width: "30%"
            },
            {
                data: "interest_rate",
                width: "auto",
                className: "text-right"
            },
            {
                data: "investment_min",
                width: "auto",
                className: "text-right"
            },
            {
                data: "investment_max",
                width: "auto",
                className: "text-right"
            },
            {
                data: "date_created",
                width: "30%"
            },
            {
                width: "15%",
                "mRender": function (data, type, full) {
                    let status_ = (full.status === 1) ? 0 : 1;
                    let status_label = (full.status === 1) ? "Deactivate" : "Activate";
                    let status_class = (full.status === 1) ? "active-status" :
                        "inactive-status";
                    let strProduct = JSON.stringify(full);
                    return `
                    <div class="dropdown">
                    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false">
                        More
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenu2">
                    <a class="dropdown-item" href="./add-investment-products?id=${full.ID}">Edit</a> 
                    <button type="button" class="dropdown-item ${status_class}" onclick="updateStatus(${full.ID},${status_})">${status_label}</button>
                    <button class="dropdown-item" type="button" data-toggle="modal" data-target="#viewRequirementModal" onclick="onRequirement('${full.name}','${full.ID}')">Set Approval</button>
                    <button class="dropdown-item" type="button" data-toggle="modal" data-target="#viewReviewModal" onclick="onReview('${full.name}','${full.ID}')">Set Reviewer</button>
                    <button class="dropdown-item" type="button" data-toggle="modal" data-target="#viewPostModal" onclick="onPost('${full.name}','${full.ID}')">Set Post</button>
                    </div>
                </div>`;
                }
            }
        ]
    });
}

function ceateRequirement() {
    if (reqObject.ID === undefined) {
        reqObject.operationId = $("#list_operations").val();
        reqObject.roleId = JSON.stringify($("#list_user_roles").on('select2:select').val());
        reqObject.createdBy = (JSON.parse(localStorage.getItem("user_obj"))).ID;
        $.ajax({
            url: `investment-products/requirements`,
            'type': 'post',
            'data': reqObject,
            'success': function (data) {
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_user_roles").val(null).trigger('change');
                    $("#list_operations").val('');
                    swal('Approval set-up successfully!', '', 'success');
                    getProductRequirement(reqObject.productId);
                } else {
                    $('#wait').hide();
                    swal('Oops! An error occurred while setting requirement', '', 'error');
                }
            },
            'error': function (err) {
                $('#wait').hide();
                swal('Oops! An error occurred while setting requirement', '', 'error');
            }
        });
    } else {
        reqObject.operationId = $("#list_operations").val();
        reqObject.roleId = JSON.stringify($("#list_user_roles").on('select2:select').val());
        $.ajax({
            url: `investment-products/update-requirements/${reqObject.ID}`,
            'type': 'post',
            'data': reqObject,
            'success': function (data) {
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_user_roles").val(null).trigger('change');
                    $("#list_operations").val('');
                    swal('Approval updated successfully!', '', 'success');
                    delete reqObject.ID;
                    getProductRequirement(reqObject.productId);
                } else {
                    $('#wait').hide();
                    swal('Oops! An error occurred while updating requirement', '', 'error');
                }
            },
            'error': function (err) {
                $('#wait').hide();
                swal('Oops! An error occurred while updating requirement', '', 'error');
            }
        });
    }
}

function ceateReview() {
    if (reqObject.ID === undefined) {
        reqObject.operationId = $("#list_operations_review").val();
        reqObject.roleId = JSON.stringify($("#list_review_roles").on('select2:select').val());
        reqObject.createdBy = (JSON.parse(localStorage.getItem("user_obj"))).ID;
        $.ajax({
            url: `investment-products/reviews`,
            'type': 'post',
            'data': reqObject,
            'success': function (data) {
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_review_roles").val(null).trigger('change');
                    $("#list_operations_review").val('');
                    swal('Reviewer set-up successfully!', '', 'success');
                    getProductReview(reqObject.productId);
                } else {
                    $('#wait').hide();
                    swal('Oops! An error occurred while setting reviewer', '', 'error');
                }
            },
            'error': function (err) {
                $('#wait').hide();
                swal('Oops! An error occurred while setting reviewer', '', 'error');
            }
        });
    } else {
        reqObject.operationId = $("#list_operations_review").val();
        reqObject.roleId = JSON.stringify($("#list_review_roles").on('select2:select').val());
        $.ajax({
            url: `investment-products/update-reviews/${reqObject.ID}`,
            'type': 'post',
            'data': reqObject,
            'success': function (data) {
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_review_roles").val(null).trigger('change');
                    $("#list_operations_review").val('');
                    swal('Reviewer updated successfully!', '', 'success');
                    delete reqObject.ID;
                    getProductReview(reqObject.productId);
                } else {
                    $('#wait').hide();
                    swal('Oops! An error occurred while updating reviewer', '', 'error');
                }
            },
            'error': function (err) {
                $('#wait').hide();
                swal('Oops! An error occurred while updating reviewer', '', 'error');
            }
        });
    }
}

function ceatePost() {
    if (reqObject.ID === undefined) {
        reqObject.operationId = $("#list_operations_post").val();
        reqObject.roleId = JSON.stringify($("#list_post_roles").on('select2:select').val());
        reqObject.createdBy = (JSON.parse(localStorage.getItem("user_obj"))).ID;
        $.ajax({
            url: `investment-products/posts`,
            'type': 'post',
            'data': reqObject,
            'success': function (data) {
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_post_roles").val(null).trigger('change');
                    $("#list_operations_post").val('');
                    swal('Post role(s) set-up successfully!', '', 'success');
                    getProductPost(reqObject.productId);
                } else {
                    $('#wait').hide();
                    swal('Oops! An error occurred while setting reviewer', '', 'error');
                }
            },
            'error': function (err) {
                $('#wait').hide();
                swal('Oops! An error occurred while setting reviewer', '', 'error');
            }
        });
    } else {
        reqObject.operationId = $("#list_operations_post").val();
        reqObject.roleId = JSON.stringify($("#list_post_roles").on('select2:select').val());
        $.ajax({
            url: `investment-products/update-posts/${reqObject.ID}`,
            'type': 'post',
            'data': reqObject,
            'success': function (data) {
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_post_roles").val(null).trigger('change');
                    $("#list_operations_post").val('');
                    swal('Post role updated successfully!', '', 'success');
                    delete reqObject.ID;
                    getProductPost(reqObject.productId);
                } else {
                    $('#wait').hide();
                    swal('Oops! An error occurred while updating Post role', '', 'error');
                }
            },
            'error': function (err) {
                $('#wait').hide();
                swal('Oops! An error occurred while updating Post role', '', 'error');
            }
        });
    }
}
let table2 = {};

function getProductRequirement(id) {
    table2 = $('#product_req_table').DataTable({
        dom: 'Blfrtip_',
        bProcessing: true,
        bServerSide: true,
        destroy: true,
        buttons: [],
        fnServerData: function (sSource, aoData, fnCallback) {
            let tableHeaders = [{
                    name: "ID",
                    query: ``
                },
                {
                    name: "operation",
                    query: `ORDER BY operationId ${aoData[2].value[0].dir}`
                },
                {
                    name: "role",
                    query: ``
                },
                {
                    name: "action",
                    query: ``
                }
            ];
            $.ajax({
                dataType: 'json',
                type: "GET",
                url: `/investment-products/requirements/${id}`,
                data: {
                    limit: aoData[4].value,
                    offset: aoData[3].value,
                    draw: aoData[0].value,
                    search_string: aoData[5].value.value,
                    order: tableHeaders[aoData[2].value[0].column].query
                },
                success: function (data) {
                    roleObject = data.data;
                    fnCallback(data)
                }
            });
        },
        columns: [{
                width: "40%",
                "mRender": function (data, type, full) {
                    return `<div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input" id="${full.ID}" ${(full.isAllRoles===1)? 'checked':''}>
                            <label class="custom-control-label" for="${full.ID}">All</label>
                        </div>`;
                }
            },

            {
                width: "15%",
                "mRender": function (data, type, full) {
                    if (full.operationId.toString() === "1") {
                        return "Deposit";
                    } else if (full.operationId.toString() === "2") {
                        return "Transfer";
                    } else if (full.operationId.toString() === "3") {
                        return "Withdrawal";
                    }
                }
            },
            {
                width: "20%",
                data: "htmlTag"
            },
            {
                width: "15%",
                "mRender": function (data, type, full) {

                    return `
                    <div class="dropdown">
                    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false">
                        More
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenu2">
                    <button class="dropdown-item" type="button" onclick="onRemoveItemReq(${full.ID})">Remove</button> 
                    <button class="dropdown-item" id="btnPariority" type="button" data-toggle="modal" data-target="#viewPariorityModal" onclick="onSelectedPariority(${full.operationId})">Priority</button> 
                    </div>
                </div>`;
                }
            }
        ]
    });
}

function getProductReview(id) {
    table2 = $('#product_req_table_review').DataTable({
        dom: 'Blfrtip_',
        bProcessing: true,
        bServerSide: true,
        destroy: true,
        buttons: [],
        fnServerData: function (sSource, aoData, fnCallback) {
            let tableHeaders = [{
                    name: "ID",
                    query: ``
                },
                {
                    name: "operation",
                    query: `ORDER BY operationId ${aoData[2].value[0].dir}`
                },
                {
                    name: "role",
                    query: ``
                },
                {
                    name: "action",
                    query: ``
                }
            ];
            $.ajax({
                dataType: 'json',
                type: "GET",
                url: `/investment-products/reviews/${id}`,
                data: {
                    limit: aoData[4].value,
                    offset: aoData[3].value,
                    draw: aoData[0].value,
                    search_string: aoData[5].value.value,
                    order: tableHeaders[aoData[2].value[0].column].query
                },
                success: function (data) {
                    roleObject = data.data;
                    fnCallback(data)
                }
            });
        },
        columns: [{
                width: "40%",
                "mRender": function (data, type, full) {
                    return `<div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input" id="${full.ID}" ${(full.isAllRoles===1)? 'checked':''}>
                            <label class="custom-control-label" for="${full.ID}">All</label>
                        </div>`;
                }
            },

            {
                width: "15%",
                "mRender": function (data, type, full) {
                    if (full.operationId.toString() === "1") {
                        return "Deposit";
                    } else if (full.operationId.toString() === "2") {
                        return "Transfer";
                    } else if (full.operationId.toString() === "3") {
                        return "Withdrawal";
                    }
                }
            },
            {
                width: "20%",
                data: "htmlTag"
            },
            {
                width: "15%",
                "mRender": function (data, type, full) {

                    return `
                    <div class="dropdown">
                    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false">
                        More
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenu2">
                    <button class="dropdown-item" type="button" onclick="onRemoveItemReview(${full.ID})">Remove</button> 
                    <button class="dropdown-item" id="btnReviewPariority" type="button" data-toggle="modal" data-target="#viewPariorityReviewModal" onclick="onSelectedReviewPariority(${full.operationId})">Priority</button> 
                    </div>
                </div>`;
                }
            }
        ]
    });
}

function getProductPost(id) {
    table2 = $('#product_req_table_post').DataTable({
        dom: 'Blfrtip_',
        bProcessing: true,
        bServerSide: true,
        destroy: true,
        buttons: [],
        fnServerData: function (sSource, aoData, fnCallback) {
            let tableHeaders = [{
                    name: "ID",
                    query: ``
                },
                {
                    name: "operation",
                    query: `ORDER BY operationId ${aoData[2].value[0].dir}`
                },
                {
                    name: "role",
                    query: ``
                },
                {
                    name: "action",
                    query: ``
                }
            ];
            $.ajax({
                dataType: 'json',
                type: "GET",
                url: `/investment-products/posts/${id}`,
                data: {
                    limit: aoData[4].value,
                    offset: aoData[3].value,
                    draw: aoData[0].value,
                    search_string: aoData[5].value.value,
                    order: tableHeaders[aoData[2].value[0].column].query
                },
                success: function (data) {
                    roleObject = data.data;
                    fnCallback(data)
                }
            });
        },
        columns: [{
                width: "40%",
                "mRender": function (data, type, full) {
                    return `<div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input" id="${full.ID}" ${(full.isAllRoles===1)? 'checked':''}>
                            <label class="custom-control-label" for="${full.ID}">All</label>
                        </div>`;
                }
            },

            {
                width: "15%",
                "mRender": function (data, type, full) {
                    if (full.operationId.toString() === "1") {
                        return "Deposit";
                    } else if (full.operationId.toString() === "2") {
                        return "Transfer";
                    } else if (full.operationId.toString() === "3") {
                        return "Withdrawal";
                    }
                }
            },
            {
                width: "20%",
                data: "htmlTag"
            },
            {
                width: "15%",
                "mRender": function (data, type, full) {

                    return `
                    <div class="dropdown">
                    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false">
                        More
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenu2">
                    <button class="dropdown-item" type="button" onclick="onRemoveItemPost(${full.ID})">Remove</button> 
                    <button class="dropdown-item" id="btnReviewPariority" type="button" data-toggle="modal" data-target="#viewPariorityPostModal" onclick="onSelectedPostPariority(${full.operationId})">Priority</button> 
                    </div>
                </div>`;
                }
            }
        ]
    });
}

$("#list_operations").on('change',
    function () {
        $.ajax({
            url: `investment-products/required-roles?productId=${reqObject.productId}&operationId=${$("#list_operations").val()}`,
            'type': 'get',
            'success': function (data) {
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_user_roles").val(null).trigger('change');
                    data.forEach(element => {
                        $("#list_user_roles").append(new Option(element.text, element.id, true, true)).trigger('change');
                    });
                    reqObject.ID = data[0].reqId;
                    $("#btn_requirement").html('Update Approval');
                } else {
                    $('#wait').hide();
                }
            },
            'error': function (err) {
                $('#wait').hide();
            }
        });
    });

function onRemoveItemReq(value) {
    swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to undo this action!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
        .then((willDelete) => {
            if (willDelete) {
                $.ajax({
                    url: `investment-products/remove-requirements/${value}`,
                    'type': 'get',
                    'success': function (data) {
                        if (data.status === undefined) {
                            $('#wait').hide();
                            swal('Approval remove successfully!', '', 'success');
                            delete reqObject.ID;
                            getProductRequirement(reqObject.productId);
                        } else {
                            $('#wait').hide();
                            swal('Oops! An error occurred while remove requirement', '', 'error');
                        }
                    },
                    'error': function (err) {
                        $('#wait').hide();
                        swal('Oops! An error occurred while remove requirement', '', 'error');
                    }
                });
            } else {

            }
        });
}

function onRemoveItemReview(value) {
    swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to undo this action!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
        .then((willDelete) => {
            if (willDelete) {
                $.ajax({
                    url: `investment-products/remove-requirements/${value}`,
                    'type': 'get',
                    'success': function (data) {
                        if (data.status === undefined) {
                            $('#wait').hide();
                            swal('Approval remove successfully!', '', 'success');
                            delete reqObject.ID;
                            getProductRequirement(reqObject.productId);
                        } else {
                            $('#wait').hide();
                            swal('Oops! An error occurred while remove requirement', '', 'error');
                        }
                    },
                    'error': function (err) {
                        $('#wait').hide();
                        swal('Oops! An error occurred while remove requirement', '', 'error');
                    }
                });
            } else {

            }
        });
}

function onRemoveItemPost(value) {
    swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to undo this action!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
        .then((willDelete) => {
            if (willDelete) {
                $.ajax({
                    url: `investment-products/remove-posts/${value}`,
                    'type': 'get',
                    'success': function (data) {
                        if (data.status === undefined) {
                            $('#wait').hide();
                            swal('Post role(s) remove successfully!', '', 'success');
                            delete reqObject.ID;
                            getProductRequirement(reqObject.productId);
                        } else {
                            $('#wait').hide();
                            swal('Oops! An error occurred while remove Post role(s)', '', 'error');
                        }
                    },
                    'error': function (err) {
                        $('#wait').hide();
                        swal('Oops! An error occurred while remove Post role(s)', '', 'error');
                    }
                });
            } else {

            }
        });
}

$('#product_req_table tbody').on('click', '.dropdown-item', function () {
    selectedRow = table2.row($(this).parents('tr')).data();
});

$('#product_req_table_review tbody').on('click', '.dropdown-item', function () {
    selectedRow = table2.row($(this).parents('tr')).data();
});




$('#product_req_table tbody').on('click', '.custom-control-input', function () {
    let row = table2.row($(this).parents('tr')).data();
    let checkboxStatus = ($(this).is(':checked') === true) ? 1 : 0;
    $.ajax({
        url: `/investment-products/requirements/${row.ID}`,
        'type': 'post',
        'data': {
            isAllRoles: checkboxStatus
        },
        'success': function (data) {
            if (data.status === undefined) {
                $('#wait').hide();
                swal(`Approval criteria updated updated successfully!. ${(checkboxStatus===1)?'All role(s) must approve':'Either one of the role(s) must approve'} `, '', 'success');
            } else {
                $('#wait').hide();
                swal('Oops! An error occurred while updating approval criteria', '', 'error');
            }
        },
        'error': function (err) {
            $('#wait').hide();
            swal('Oops! An error occurred while updating approval criteria', '', 'error');
        }
    });
});
let movedToItems = [];
let movedFromItems = [];

function onSelectedPariority(operationId) {
    movedToItems = [];
    movedFromItems = [];
    let operationRoles = JSON.parse(JSON.stringify(roleObject.filter(x => x.operationId === operationId.toString())[0]));

    movedFromItems = operationRoles.roles;
    movedToItems = (operationRoles.priority === null) ? [] : operationRoles.priority;

    movedToItems.map(x => {
        movedFromItems = movedFromItems.filter(y => y.id !== x.id);
    });
    $("#lstRoles_1").html('');
    movedFromItems.map(x => {
        $("#lstRoles_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChoosePariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRoles_2").html('');
    movedToItems.map(x => {
        $("#lstRoles_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemovePariority(${x.id})">${x.name}</button>
        `);
    });

}

function onSelectedReviewPariority(operationId) {
    movedToItems = [];
    movedFromItems = [];
    let operationRoles = JSON.parse(JSON.stringify(roleObject.filter(x => x.operationId === operationId.toString())[0]));

    movedFromItems = operationRoles.roles;
    movedToItems = (operationRoles.priority === null) ? [] : operationRoles.priority;

    movedToItems.map(x => {
        movedFromItems = movedFromItems.filter(y => y.id !== x.id);
    });
    $("#lstRolesReview_1").html('');
    movedFromItems.map(x => {
        $("#lstRolesReview_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChooseReviewPariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRolesReview_2").html('');
    movedToItems.map(x => {
        $("#lstRolesReview_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemoveReviewPariority(${x.id})">${x.name}</button>
        `);
    });

}

function onSelectedReviewPost(operationId) {
    movedToItems = [];
    movedFromItems = [];
    let operationRoles = JSON.parse(JSON.stringify(roleObject.filter(x => x.operationId === operationId.toString())[0]));

    movedFromItems = operationRoles.roles;
    movedToItems = (operationRoles.priority === null) ? [] : operationRoles.priority;

    movedToItems.map(x => {
        movedFromItems = movedFromItems.filter(y => y.id !== x.id);
    });
    $("#lstRolesPost_1").html('');
    movedFromItems.map(x => {
        $("#lstRolesPost_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChooseReviewPariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRolesPost_2").html('');
    movedToItems.map(x => {
        $("#lstRolesPost_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemoveReviewPariority(${x.id})">${x.name}</button>
        `);
    });

}


function onChoosePariority(id) {
    let item = movedFromItems.filter(x => x.id === id);
    movedToItems.push(item[0]);
    movedFromItems = movedFromItems.filter(x => x.id !== id);
    $("#lstRoles_1").html('');
    movedFromItems.map(x => {
        $("#lstRoles_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChoosePariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRoles_2").html('');
    movedToItems.map(x => {
        $("#lstRoles_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemovePariority(${x.id})">${x.name}</button>
        `);
    });

    setPriority(selectedRow.ID, movedToItems);
}

function onChooseReviewPariority(id) {
    let item = movedFromItems.filter(x => x.id === id);
    movedToItems.push(item[0]);
    movedFromItems = movedFromItems.filter(x => x.id !== id);
    $("#lstRolesReview_1").html('');
    movedFromItems.map(x => {
        $("#lstRolesReview_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChooseReviewPariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRolesReview_2").html('');
    movedToItems.map(x => {
        $("#lstRolesReview_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemoveReviewPariority(${x.id})">${x.name}</button>
        `);
    });

    setReviewPriority(selectedRow.ID, movedToItems);
}

function onChoosePostPariority(id) {
    let item = movedFromItems.filter(x => x.id === id);
    movedToItems.push(item[0]);
    movedFromItems = movedFromItems.filter(x => x.id !== id);
    $("#lstRolesPost_1").html('');
    movedFromItems.map(x => {
        $("#lstRolesPost_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChooseReviewPariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRolesPost_2").html('');
    movedToItems.map(x => {
        $("#lstRolesPost_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemoveReviewPariority(${x.id})">${x.name}</button>
        `);
    });

    setPostPriority(selectedRow.ID, movedToItems);
}

function onRemovePariority(id) {
    let item = movedToItems.filter(x => x.id === id);
    movedFromItems.push(item[0]);
    movedToItems = movedToItems.filter(x => x.id !== id);
    $("#lstRoles_1").html('');
    movedFromItems.map(x => {
        $("#lstRoles_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChoosePariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRoles_2").html('');
    movedToItems.map(x => {
        $("#lstRoles_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemovePariority(${x.id})">${x.name}</button>
        `);
    });

    setPriority(selectedRow.ID, movedToItems);
}

function onRemoveReviewPariority(id) {
    let item = movedToItems.filter(x => x.id === id);
    movedFromItems.push(item[0]);
    movedToItems = movedToItems.filter(x => x.id !== id);
    $("#lstRolesReview_1").html('');
    movedFromItems.map(x => {
        $("#lstRolesReview_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChooseReviewPariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRolesReview_2").html('');
    movedToItems.map(x => {
        $("#lstRolesReview_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemoveReviewPariority(${x.id})">${x.name}</button>
        `);
    });
    setReviewPriority(selectedRow.ID, movedToItems);
}

function onRemovePostPariority(id) {
    let item = movedToItems.filter(x => x.id === id);
    movedFromItems.push(item[0]);
    movedToItems = movedToItems.filter(x => x.id !== id);
    $("#lstRolesPost_1").html('');
    movedFromItems.map(x => {
        $("#lstRolesPost_1").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onChoosePostPariority(${x.id})">${x.name}</button>
        `);
    });

    $("#lstRolesPost_2").html('');
    movedToItems.map(x => {
        $("#lstRolesPost_2").append(`
            <button type="button" id="${x.id}" class="list-group-item list-group-item-action" onclick="onRemovePostPariority(${x.id})">${x.name}</button>
        `);
    });
    setPostPriority(selectedRow.ID, movedToItems);
}

function setPriority(id, priority) {
    $.ajax({
        url: `/investment-products/update-approval/${id}`,
        'type': 'post',
        'data': {
            priority: JSON.stringify(priority)
        },
        'success': function (data) {
            if (data.status === undefined) {
                $('#wait').hide();
                swal(`Approval priority updated updated successfully`, '', 'success');
            } else {
                $('#wait').hide();
                swal('Oops! An error occurred while updating approval priority', '', 'error');
            }
        },
        'error': function (err) {
            $('#wait').hide();
            swal('Oops! An error occurred while updating approval priority', '', 'error');
        }
    });
}

function setReviewPriority(id, priority) {
    $.ajax({
        url: `/investment-products/update-review-priority/${id}`,
        'type': 'post',
        'data': {
            priority: JSON.stringify(priority)
        },
        'success': function (data) {
            if (data.status === undefined) {
                $('#wait').hide();
                swal(`Review priority updated updated successfully`, '', 'success');
            } else {
                $('#wait').hide();
                swal('Oops! An error occurred while updating review priority', '', 'error');
            }
        },
        'error': function (err) {
            $('#wait').hide();
            swal('Oops! An error occurred while updating review priority', '', 'error');
        }
    });
}

function setPostPriority(id, priority) {
    $.ajax({
        url: `/investment-products/update-post-priority/${id}`,
        'type': 'post',
        'data': {
            priority: JSON.stringify(priority)
        },
        'success': function (data) {
            if (data.status === undefined) {
                $('#wait').hide();
                swal(`Post priority updated updated successfully`, '', 'success');
            } else {
                $('#wait').hide();
                swal('Oops! An error occurred while updating post priority', '', 'error');
            }
        },
        'error': function (err) {
            $('#wait').hide();
            swal('Oops! An error occurred while updating post priority', '', 'error');
        }
    });
}