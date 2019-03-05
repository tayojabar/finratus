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
                products = data;
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
                                text: `${item.name} (${item.code})`,
                                min: item.investment_min,
                                max: item.investment_max
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

// $("#investment_interest").on("keyup", function (event) {
//     let val = $("#investment_interest").val();
//     $("#investment_interest").val(formater(val));
// }); $('#investment_product').on('select2:select').val(),

$("#investment_product").on("change", function (event) {
    const selectedID = $(this).val();
    let selectedValue = products.find(x => x.ID.toString() === selectedID.toString());
    $("#product_def").html(`Min.: ${selectedValue.investment_min} Max.:${selectedValue.investment_max}`);
    console.log(selectedID);
    console.log(selectedValue);
});




let start_with = "";
$("#investment_date_start").on("change", function (event) {
    let val = $("#investment_date_start").val();
    start_with = val;
    $('#investment_mature_date').attr('disabled', false);
    $('#investment_mature_date').attr('min', start_with);
});

$("#btn_save_product").on("click", function (event) {
    var data = {
        clientId: $('#client').on('select2:select').val(),
        productId: $('#investment_product').on('select2:select').val(),
        amount: $('#investment_amount').val(),
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
                var url = "./all-investment-products";
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

function validate() {

    if (

        $('#client').on('select2:select').val() !== "0" &&
        $('#investment_product').on('select2:select').val() !== "0",
        $('#investment_amount').val() !== "" &&
        $('#investment_date_start').val() !== "" &&
        $('#investment_mature_date').val() !== ""
    ) {
        $("#btn_save_product").attr('disabled', false);
    }
}