var table = {};
let reqObject = {};
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
    console.log(id);
    $("#viewRequirementModalHeader").html(`${value} Requirement`);

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
                console.log(data);
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
                    name: "code",
                    query: `ORDER BY code ${aoData[2].value[0].dir}`
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
            aTargets: [2, 3, 4],
            sType: "numeric"
        }],
        columns: [{
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
                    console.log(full);
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
                    <button class="dropdown-item" type="button" href="./add-investment-products?id=${full.ID}">Edit</button> 
                    <button type="button" class="dropdown-item ${status_class}" onclick="updateStatus(${full.ID},${status_})">${status_label}</button>
                    <button class="dropdown-item" type="button" data-toggle="modal" data-target="#viewRequirementModal" onclick="onRequirement('${full.name}','${full.ID}')">Requirement</button>
                    </div>
                </div>`;
                }
            }
        ]
    });
}

function ceateRequirement() {
    console.log(reqObject);
    if (reqObject.ID === undefined) {
        reqObject.operationId = $("#list_operations").val();
        reqObject.roleId = JSON.stringify($("#list_user_roles").on('select2:select').val());
        reqObject.createdBy = (JSON.parse(localStorage.getItem("user_obj"))).ID;
        console.log($("#list_user_roles").on('select2:select').val());
        $.ajax({
            url: `investment-products/requirements`,
            'type': 'post',
            'data': reqObject,
            'success': function (data) {
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_user_roles").val(null).trigger('change');
                    $("#list_operations").val('');
                    swal('Requirement set-up successfully!', '', 'success');
                    reqObject = {};
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
                console.log(data);
                if (data.status === undefined) {
                    $('#wait').hide();
                    $("#list_user_roles").val(null).trigger('change');
                    $("#list_operations").val('');
                    swal('Requirement updated successfully!', '', 'success');
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
                    console.log(data);
                    fnCallback(data)
                }
            });
        },
        columns: [{
                "mRender": function (data, type, full) {
                    console.log(full);
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
                data: "htmlTag"
            },
            {
                width: "15%",
                "mRender": function (data, type, full) {
                    console.log(full);
                    return `
                    <div class="dropdown">
                    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false">
                        More
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenu2">
                    <button class="dropdown-item" type="button" onclick="onRemoveItemReq(${full.ID})">Remove</button> 
                    </div>
                </div>`;
                }
            }
        ]
    });
}

$("#list_operations").on('change',
    function () {
        console.log($("#list_user_roles").on('select2:select').val());
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
                    $("#btn_requirement").html('Update Requirement');
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
                        console.log(data);
                        if (data.status === undefined) {
                            $('#wait').hide();
                            swal('Requirement remove successfully!', '', 'success');
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