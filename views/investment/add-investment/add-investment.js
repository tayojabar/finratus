var addMonths = '../../../node_modules/date-fns/add_months/index';
// import * as differenceInMinutes from 'date-fns/difference_in_minutes';

$(document).ready(function () {
    component_initializer();
});
var productsControl = {};
var products = [];

function component_initializer() {
    $('#client').select2({
        allowClear: true,
        placeholder: "Search by Email/Fullname",
        ajax: {
            url: "/client-service/all",
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
                console.log(params);
                params.page = params.page || 1;
                console.log(data);
                if (data.error) {
                    return {
                        results: []
                    };
                } else {
                    return {
                        results: data.map(function (item) {
                            return {
                                id: item.ID,
                                text: item.fullname
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

    productsControl = $('#investment_product').select2({
        allowClear: true,
        placeholder: "Search by Product Code/Name",
        ajax: {
            url: "/investment-products/all",
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
                if (data.length > 0) {
                    products.push(...data);
                }
                params.page = params.page || 1;
                console.log(products);
                if (data.error) {
                    return {
                        results: []
                    };
                } else {
                    return {
                        results: data.map(function (item) {
                            return {
                                id: item.ID,
                                text: `${item.name} (${item.code})`,
                                min: item.investment_min,
                                max: item.investment_max,
                                min_term: item.min_term,
                                max_term: item.max_term

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
}

$("#investment_amount").on("keyup", function (event) {
    let val = $("#investment_amount").val();
    $("#investment_amount").val(formater(val));
});

$("#investment_amount").on("focusout", function (event) {
    const selectedID = $("#investment_product").val();
    let selectedValue = products.find(x => x.ID.toString() === selectedID.toString());
    if (selectedValue !== undefined) {
        let amount = $("#investment_amount").val().split(',').join('');
        let amt_min = selectedValue.investment_min.split(',').join('');
        let amt_max = selectedValue.investment_max.split(',').join('');
        console.log(amount, amt_min, amt_max);
        if (parseFloat(amount) < parseFloat(amt_min) || parseFloat(amount) > parseFloat(amt_max)) {
            $("#investment_amount").val("");
            $("#amount_info_error").html(" - Amount can not be below or above configured investment value");
        } else {
            $("#amount_info_error").html("");
        }
    }
});

// $("#investment_interest").on("keyup", function (event) {
//     let val = $("#investment_interest").val();
//     $("#investment_interest").val(formater(val));
// }); $('#investment_product').on('select2:select').val(),

$("#investment_product").on("change", function (event) {
    const selectedID = $("#investment_product").val();
    console.log(selectedID);
    console.log(products);
    let selectedValue = products.find(x => x.ID.toString() === selectedID.toString());
    console.log(products);
    $("#amount_info").html(`Min.: ${selectedValue.investment_min} Max.:${selectedValue.investment_max}`);
    console.log(selectedID);
    console.log(selectedValue);
});

function pad(d) {
    return (parseInt(d) < 10) ? '0' + d.toString() : d.toString();
}



let start_with = "";
$("#investment_date_start").on("change", function (event) {
    let val = $("#investment_date_start").val();
    start_with = val;
    console.log(start_with);
    $('#investment_mature_date').attr('disabled', false);

    const selectedID = $("#investment_product").val();
    let selectedValue = products.find(x => x.ID.toString() === selectedID.toString());
    var min_date = new Date(start_with);
    var max_date = new Date(start_with);
    min_date.setMonth((min_date.getMonth() + 1) + parseInt(selectedValue.min_term));
    max_date.setMonth((max_date.getMonth() + 1) + parseInt(selectedValue.max_term));

    let _min = `${min_date.getUTCFullYear()}-${pad(min_date.getMonth())}-${pad(min_date.getDate())}`;
    let _max = `${max_date.getUTCFullYear()}-${pad(max_date.getMonth())}-${pad(max_date.getDate())}`;
    $('#investment_mature_date').attr('min', _min);
    $('#investment_mature_date').attr('max', _max);
    $("#duration_info").html(`Min.: ${pad(min_date.getDate())}-${pad(min_date.getMonth())}-${min_date.getUTCFullYear()} Max.: ${pad(max_date.getDate())}-${pad(max_date.getMonth())}-${max_date.getUTCFullYear()}`);

});

$("#btn_save_product").on("click", function (event) {
    var data = {
        clientId: $('#client').on('select2:select').val(),
        productId: $('#investment_product').on('select2:select').val(),
        amount: $('#investment_amount').val().split('.'),
        investment_start_date: $('#investment_date_start').val(),
        investment_mature_date: $('#investment_mature_date').val()
    };
    $.ajax({
        'url': '/investment-service/create',
        'type': 'post',
        'data': data,
        'success': function (data) {
            if (data.error) {
                $('#wait').hide();
                swal('Oops! An error occurred while creating Investment; ' + data.error
                    .sqlMessage,
                    '', 'error');
            } else {
                $('#wait').hide();
                swal('Investment created successfully!', '', 'success');
                var url = "./all-investments";
                $(location).attr('href', url);
                $('input').val("");
                $('input').prop("checked", false);
            }
        },
        'error': function (err) {
            $('#wait').hide();
            swal('Oops! An error occurred while creating Investment; ' + data.error.sqlMessage,
                '', 'error');
        }
    });

});

$("input").on("change", function (event) {
    validate();
});

$("select").on("change", function (event) {
    validate();
});

function validate() {
    if (

        $('#client').on('select2:select').val() !== "0" &&
        $('#investment_product').on('select2:select').val() !== "0" &&
        $('#investment_amount').val() !== "" &&
        $('#investment_date_start').val() !== "" &&
        $('#investment_mature_date').val() !== ""
    ) {
        $("#btn_save_product").attr('disabled', false);
    } else {
        $("#btn_save_product").attr('disabled', true);
    }
}