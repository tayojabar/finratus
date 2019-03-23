(function( $ ) {
    jQuery(document).ready(function() {
        getUsers();
    });

    $(document).ajaxStart(function(){
        $("#wait").css("display", "block");
    });

    $(document).ajaxComplete(function(){
        $("#wait").css("display", "none");
    });

    const urlParams = new URLSearchParams(window.location.search);
    const user_id = urlParams.get('t');
    let preapproved_loan = {};

    function getPreapprovedLoan(){
        $.ajax({
            type: "GET",
            url: `/preapproved-loan/get/${encodeURIComponent(user_id)}`,
            success: function (response) {
                preapproved_loan = response.data;
                if (preapproved_loan){
                    $('#user-list').val($("#user-list option:contains('"+preapproved_loan.client+"')").val());
                    $('#user-list').prop('disabled', true);
                    $('#workflows').val(preapproved_loan.workflowID);
                    $('#workflows').prop('disabled', true);
                    $('#amount').val(numberToCurrencyformatter(preapproved_loan.loan_amount));
                    $('#amount').prop('disabled', true);
                    $('#interest-rate').val(numberToCurrencyformatter(preapproved_loan.interest_rate));
                    $('#interest-rate').prop('disabled', true);
                    $('#term').val(numberToCurrencyformatter(preapproved_loan.duration));
                    $('#term').prop('disabled', true);
                    $('#repayment-date').val(preapproved_loan.repayment_date);
                    $('#repayment-date').prop('disabled', true);
                    $('#client-text').text(preapproved_loan.client);
                    $('#loan-amount-text').text(`₦${numberToCurrencyformatter(preapproved_loan.loan_amount)}`);
                    $('#tenor-text').text(`${numberToCurrencyformatter(preapproved_loan.duration)} month(s)`);
                    $('#interest-rate-text').text(`${numberToCurrencyformatter(preapproved_loan.interest_rate)}%`);
                    $('#first-repayment-text').text(preapproved_loan.repayment_date);
                    $('#expiry-text').html(`Please note that this loan offer is only valid till <strong>${preapproved_loan.expiry_date}</strong>`);
                    displaySchedule(preapproved_loan.schedule);
                    if (preapproved_loan.status !== 1){
                        $('#acceptApplication').hide();
                        $('#declineApplication').hide();
                        let message = '<div class="text-muted" style="text-align: center" >\n' +
                                    '    <div width="100px" height="100px" class="img-thumbnail" style="text-align: center; border: transparent">' +
                                    '       <i class="fa fa-exclamation-circle fa-lg" style="font-size: 10em; margin: 60px 0 30px 0;"></i>'+
                                    '    <h2>No Offer Available!</h2>\n' +
                                    '    <p><br/>You will be contacted when next we have an offer available for you.</p><br/>\n' +
                                    '</div>';
                        $('.card-body').html(message);
                        return swal('This offer is no longer available!','','error');
                    }
                } else {
                    $('#acceptApplication').hide();
                    $('#declineApplication').hide();
                    let message = '<div class="text-muted" style="text-align: center" >\n' +
                        '    <div width="100px" height="100px" class="img-thumbnail" style="text-align: center; border: transparent">' +
                        '       <i class="fa fa-exclamation-circle fa-lg" style="font-size: 10em; margin: 60px 0 30px 0;"></i>'+
                        '    <h2>No Offer Available!</h2>\n' +
                        '    <p><br/>You will be contacted when next we have an offer available for you.</p><br/>\n' +
                        '</div>';
                    $('.card-body').html(message);
                    return swal('This offer is no longer available!','','error');
                }
            }
        });
    }

    function getUsers(){
        $.ajax({
            type: "GET",
            url: "/user/users-list-v2",
            success: function (response) {
                $.each(JSON.parse(response), function (key, val) {
                    $("#user-list").append('<option value = "' + encodeURIComponent(JSON.stringify(val)) + '">' + val.fullname + '</option>');
                });
                getPreapprovedLoan();
            }
        });
    }

    function displaySchedule(schedule) {
        let $loanSchedule = $("#loanSchedule"),
            table = $("<table border='1' style='text-align: center;'/>");
        for (let i = 0; i < schedule.length+2; i++) {
            let row,
                cells = [];
            if (i <= 1){
                row = $('<tr style="font-weight: bold;" />');
            } else {
                row = $("<tr />");
                if (schedule[i - 2]['status'] === 2)
                    continue;
                if (parseInt(schedule[i - 2]['status']) === 0)
                    row = $("<tr style='background-color: #aaaaaa; text-decoration: line-through;' />");
            }
            if (i === 0) {
                cells = ["PRINCIPAL","INTEREST","BALANCE","TOTAL"];
            } else if (i === 1) {
                cells = ["INVOICE DATE","COLLECTION DATE","AMOUNT","INVOICE DATE","COLLECTION DATE","AMOUNT","AMOUNT","AMOUNT"];
            } else {
                cells[0] = schedule[i - 2]['payment_create_date'];
                cells[1] = schedule[i - 2]['payment_collect_date'];
                cells[2] = schedule[i - 2]['payment_amount'];
                cells[3] = schedule[i - 2]['interest_create_date'];
                cells[4] = schedule[i - 2]['interest_collect_date'];
                cells[5] = schedule[i - 2]['interest_amount'];
                cells[6] = schedule[i - 2]['balance'];
                cells[7] = (parseFloat(cells[2]) + parseFloat(cells[5])).round(2);
                $('#payment-amount').val(numberToCurrencyformatter(cells[7]));
            }
            for (let j = 0; j < cells.length; j++) {
                let cell = $("<td />");
                if (i === 0){
                    if ((cells[j] === "PRINCIPAL") || cells[j] === "INTEREST")
                        cell = $("<td colspan='3' />");
                    if (cells[j] === "COLLECTION")
                        cell = $("<td colspan='2' />");
                }
                if (cells[j]){
                    cell.html(cells[j]);
                } else {
                    cell.html('--');
                }
                row.append(cell);
            }
            table.append(row);
        }
        $loanSchedule.html('');
        $loanSchedule.append(table);
    }

    $("#acceptApplication").click(function () {
        swal({
            title: "Are you sure?",
            text: "Once accepted, this process is not reversible!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((yes) => {
                if (yes) {
                    $.ajax({
                        'url': `/preapproved-loan/offer/accept/${preapproved_loan.ID}`,
                        'type': 'post',
                        'data': {
                            email: preapproved_loan.email,
                            fullname: preapproved_loan.client,
                            created_by: preapproved_loan.created_by,
                            workflow_id: preapproved_loan.workflowID,
                            application_id: preapproved_loan.applicationID
                        },
                        'success': function (data) {
                            notification('Loan accepted successfully','','success');
                            window.location.reload();
                        },
                        'error': function (err) {
                            console.log(err);
                            notification('No internet connection','','error');
                        }
                    });
                }
            });
    });

    $("#declineApplication").click(function () {
        swal({
            title: "Are you sure?",
            text: "Once declined, this process is not reversible!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((yes) => {
                if (yes) {
                    $.ajax({
                        'url': `/preapproved-loan/offer/decline/${preapproved_loan.ID}`,
                        'type': 'get',
                        'success': function (data) {
                            notification('Loan declined successfully','','success');
                            window.location.reload();
                        },
                        'error': function (err) {
                            console.log(err);
                            notification('No internet connection','','error');
                        }
                    });
                }
            });
    });
})(jQuery);