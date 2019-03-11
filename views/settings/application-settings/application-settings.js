var product_obj = {};
$(document).ready(function () {
    get_global_items();
});

$(document).ajaxStart(function () {
    $("#wait").css("display", "block");
});

$(document).ajaxComplete(function () {
    $("#wait").css("display", "none");
});

$("#saving_fees").on("keyup", function (event) {
    let val = $("#saving_fees").val();
    $("#saving_fees").val(formater(val));
});

function get_global_items() {
    var sPageURL = window.location.search.substring(1);
    console.log(sPageURL);
    if (sPageURL !== "") {
        var sURLVariables = sPageURL.split('=')[1];
        console.log(sURLVariables);
        if (sURLVariables !== "") {
            getInvestmentProducts(sURLVariables);
        }
    }
    for (var i = 0; i < interest_conditions.length; i++) {
        $('<option/>').val(interest_conditions[i].value).html(interest_conditions[i].value).appendTo(
            '#condition_for_interest');
    }
    for (var i = 0; i < freq_withdrawal.length; i++) {
        $('<option/>').val(freq_withdrawal[i].value).html(freq_withdrawal[i].value).appendTo(
            '#withdrawal_charge_duration');
    }
}

$("#product_investment_amount_min").on("keyup", function (event) {
    let val = $("#product_investment_amount_min").val();
    $("#product_investment_amount_min").val(formater(val));
});

$("#minimum_bal_penalty_amount").on("keyup", function (event) {
    let val = $("#minimum_bal_penalty_amount").val();
    $("#minimum_bal_penalty_amount").val(formater(val));
});

$("#product_investment_amount_max").on("keyup", function (event) {
    let val = $("#product_investment_amount_max").val();
    $("#product_investment_amount_max").val(formater(val));
});

$("#minimum_bal").on("keyup", function (event) {
    let val = $("#minimum_bal").val();
    $("#minimum_bal").val(formater(val));
});

$("#withdrawal_charge_freq").on("keyup", function (event) {
    let val = $("#withdrawal_charge_freq").val();
    $("#withdrawal_charge_freq").val(formater(val));
});

$("#charge_interest_on_withdrawal").on("keyup", function (event) {
    let val = $("#charge_interest_on_withdrawal").val();
    $("#charge_interest_on_withdrawal").val(formater(val));
});

$("#min_term").on("keyup", function (event) {
    let val = $("#min_term").val();
    $('#max_term').attr('min', val);
});

$("#max_term").on("focusout", function (event) {
    let min_ = parseInt($("#min_term").val());
    let max_ = parseInt($("#max_term").val());
    console.log(min_, max_);
    if (min_ > max_) {
        $('#max_term').val("");
    }
    console.log("here is here");
});

function getInvestmentProducts(id) {
    $.ajax({
        type: "GET",
        url: `/investment/products/${id}`,
        success: function (data) {
            if (data.status === undefined) {
                product_obj = data[0];
                console.log(product_obj.saving_charge_opt);
                product_obj.histories = JSON.parse(product_obj.histories);
                $('#product_name').val(product_obj.name);
                $('#product_investment_amount_min').val(product_obj.investment_min);
                $('#product_investment_amount_max').val(product_obj.investment_max);
                $('#withdrawal_conditions_value').val(product_obj.freq_withdrawal);
                $('#saving_fees').val(product_obj.saving_fees);
                $('#opt_on_deposit').val((product_obj.saving_charge_opt === null) ? $(
                    '#opt_on_deposit').val() : product_obj.saving_charge_opt);
                $('#withdrawal_charge_freq').val(product_obj.withdrawal_fees);
                $('#withdrawal_charge_duration').val(product_obj.withdrawal_freq_duration);
                $('#minimum_bal').val(product_obj.minimum_bal);
                $('#product_code').val(product_obj.code);
                $('#interest_rate').val(product_obj.interest_rate);
                $('#condition_for_interest').val(product_obj.interest_disbursement_time);
                $('#forfeit_interest_on_withdrawal').prop('checked', true);
                $('#minimum_bal_penalty_amount').val(product_obj.minimum_bal_charges);
                $('#opt_on_minimum_bal_penalty_amount').val((product_obj.minimum_bal_charges_opt ===
                    null) ? $(
                    '#opt_on_minimum_bal_penalty_amount').val() : product_obj.minimum_bal_charges_opt);

                $('#charge_interest_on_withdrawal').val(product_obj.interest_forfeit_charge);
                $('#opt_on_charge_interest_on_withdrawal').val((product_obj.interest_forfeit_charge_opt ===
                    null) ? $(
                    '#opt_on_charge_interest_on_withdrawal').val() : product_obj.interest_forfeit_charge_opt);

                $('#opt_on_freq_charge').val((product_obj.withdrawal_freq_fees_opt ===
                    null) ? $(
                    '#opt_on_freq_charge').val() : product_obj.withdrawal_freq_fees_opt);
                $('#acct_allows_withdrawal').prop('checked', ((product_obj.acct_allows_withdrawal) ?
                    true : false));
                $('#inv_moves_wallet').prop('checked', ((product_obj.inv_moves_wallet) ?
                    true : false));
                $('#interest_moves_wallet').prop('checked', ((product_obj.interest_moves_wallet) ?
                    true : false));
                $('#min_term').val(product_obj.min_term);
                $('#max_term').val(product_obj.max_term);
                $('#btnSaveProduct').html('Update');
                $('#wait').hide();
            } else {
                $('#wait').hide();
                swal('Oops! An error occurred while geting Investment Product; ' + data.error
                    .sqlMessage,
                    '', 'error');
            }
        }
    });
}

$("#chk_interest_rate").on('change',
    function () {
        let status = $('#chk_interest_rate').is(':checked');
        activate_interest_controls(!status);
    });

function activate_interest_controls(status) {
    $('#interest_rate').attr('disabled', status);
    $('#condition_for_interest').attr('disabled', status);
    $('#forfeit_interest_on_withdrawal').attr('disabled', status);
}

$("#forfeit_interest_on_withdrawal").on('change',
    function () {
        let _status = $('#forfeit_interest_on_withdrawal').is(':checked');
        activate_interest_penalty_controls(!_status);
    });

function activate_interest_penalty_controls(status) {
    $('#charge_interest_on_withdrawal').attr('disabled', status);
    $('#opt_on_charge_interest_on_withdrawal').attr('disabled', status);
}



function saveApplicationSettings() {
    console.log(product_obj.histories);
    product_obj.name = $('#product_name').val();
    product_obj.investment_max = $('#product_investment_amount_max').val();
    product_obj.investment_min = $('#product_investment_amount_min').val();
    product_obj.freq_withdrawal = $('#withdrawal_conditions_value').val();
    product_obj.saving_fees = $('#saving_fees').val();
    product_obj.saving_charge_opt = $('#opt_on_deposit').val();
    product_obj.withdrawal_fees = $('#withdrawal_charge_freq').val();
    product_obj.withdrawal_freq_duration = $('#withdrawal_charge_duration').val();
    product_obj.minimum_bal = $('#minimum_bal').val();
    product_obj.code = $('#product_code').val();
    product_obj.interest_rate = $('#interest_rate').val();
    product_obj.interest_disbursement_time = $('#condition_for_interest').val();
    product_obj.is_forfeit = $('#forfeit_interest_on_withdrawal').is(':checked') ? 1 : 0;
    product_obj.interest_forfeit_charge = $('#charge_interest_on_withdrawal').val();
    product_obj.interest_forfeit_charge_opt = $('#opt_on_charge_interest_on_withdrawal').val();
    product_obj.minimum_bal_charges = $('#minimum_bal_penalty_amount').val();
    product_obj.minimum_bal_charges_opt = $('#opt_on_minimum_bal_penalty_amount').val();
    product_obj.withdrawal_freq_fees_opt = $('#opt_on_freq_charge').val();

    product_obj.acct_allows_withdrawal = $('#acct_allows_withdrawal').is(':checked') ? 1 : 0;
    product_obj.inv_moves_wallet = $('#inv_moves_wallet').is(':checked') ? 1 : 0;
    product_obj.interest_moves_wallet = $('#interest_moves_wallet').is(':checked') ? 1 : 0;
    product_obj.min_term = $('#min_term').val();
    product_obj.max_term = $('#max_term').val();
    product_obj.histories = (product_obj.histories == null) ? [] : product_obj.histories;
    console.log(product_obj.histories);
    product_obj.createdBy = (JSON.parse(localStorage.getItem("user_obj"))).ID;

    console.log(product_obj);
    if (product_obj.ID === undefined) {
        $.ajax({
            'url': '/investment/products',
            'type': 'post',
            'data': product_obj,
            'success': function (data) {
                if (data.status === 200) {
                    $('#wait').hide();
                    swal('Investment Product created successfully!', '', 'success');
                    var url = "./all-investment-products";
                    $(location).attr('href', url);
                    $('input').val("");
                    $('input').prop("checked", false);
                } else {
                    $('#wait').hide();
                    swal('Oops! An error occurred while saving Investment Product; ' + data.error
                        .sqlMessage,
                        '', 'error');
                }
            },
            'error': function (err) {
                $('#wait').hide();
                swal('Oops! An error occurred while saving Investment Product; ' + data.error.sqlMessage,
                    '', 'error');
            }
        });
    } else {
        product_obj.histories.push({
            createdBy: (JSON.parse(localStorage.getItem("user_obj"))).ID,
            rate: product_obj.interest_rate
        });
        $.ajax({
            url: `/investment/products/${product_obj.ID}`,
            'type': 'post',
            'data': product_obj,
            'success': function (data) {
                if (data.status === 200) {
                    console.log(product_obj);
                    $('#wait').hide();
                    swal('Investment Product updated successfully!', '', 'success');
                    var url = "./all-investment-products";
                    $(location).attr('href', url);
                    $('input').val("");
                    $('input').prop("checked", false);
                } else {
                    $('#wait').hide();
                    swal('Oops! An error occurred while updating Investment Product; ' + data.error
                        .sqlMessage,
                        '', 'error');
                }
            },
            'error': function (err) {
                $('#wait').hide();
                swal('Oops! An error occurred while updating Investment Product; ' + data.error.sqlMessage,
                    '', 'error');
            }
        });
    }
}
