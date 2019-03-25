(function( $ ) {
    jQuery(document).ready(function() {
        getUsers();
        getWorkflows();
    });

    $(document).ajaxStart(function(){
        $("#wait").css("display", "block");
    });

    $(document).ajaxComplete(function(){
        $("#wait").css("display", "none");
    });

    const urlParams = new URLSearchParams(window.location.search);
    const user_id = urlParams.get('id');
    let preapproved_loan = {};

    function getPreapprovedLoan(){
        $.ajax({
            type: "GET",
            url: `/preapproved-loan/get/${user_id}`,
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
                    $('#credit-score-text').text(`${preapproved_loan.credit_score}%`);
                    $('#default-frequency-text').text(numberToCurrencyformatter(preapproved_loan.defaults));
                    preapproved_loan.months_left = preapproved_loan.duration - preapproved_loan.invoices_due;
                    if (preapproved_loan.expiry_date){
                        let today = new Date(),
                            expiry = new Date(preapproved_loan.expiry_date);
                        if (expiry < today)
                            preapproved_loan.status = 4;
                    }
                    switch (preapproved_loan.status){
                        case 0: {
                            $('#status-rejected-text').show();
                            break;
                        }
                        case 1: {
                            $('#status-approved-text').show();
                            break;
                        }
                        case 2: {
                            $('#status-accepted-text').show();
                            break;
                        }
                        case 3: {
                            $('#status-declined-text').show();
                            break;
                        }
                        case 4: {
                            $('#status-expired-text').show();
                            break;
                        }
                    }
                    $('#reason').html(`
                        <p>1. Client has only ${numberToCurrencyformatter(preapproved_loan.months_left)} repayment(s) left.</p>
                        <p>2. Client has only defaulted ${preapproved_loan.defaults} out of ${numberToCurrencyformatter(preapproved_loan.invoices_due)} due payment(s).</p>
                        <p>3. Client earns ₦${numberToCurrencyformatter(preapproved_loan.salary || 0)} monthly.</p>
                        <p>4. Client has borrowed an average loan of ₦${numberToCurrencyformatter(preapproved_loan.average_loan)}.</p>
                        <p>5. Client has been an active customer for ${numberToCurrencyformatter(preapproved_loan.duration)} month(s).</p>
                        <p>6. Client is eligible for a loan of ₦${numberToCurrencyformatter(preapproved_loan.loan_amount)} to be repaid over 12 month(s).</p>
                    `);
                    displaySchedule(preapproved_loan.schedule);
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

    function getWorkflows(){
        $.ajax({
            type: "GET",
            url: "/workflows",
            success: function (response) {
                $.each(response.response, function (key, val) {
                    $("#workflows").append('<option value = "'+val.ID+'"">'+val.name+'</option>');
                });
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

    $("#deletePreapprovedLoan").click(function () {
        swal({
            title: "Are you sure?",
            text: "Once deleted, this process is not reversible!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((yes) => {
                if (yes) {
                    $.ajax({
                        'url': `/preapproved-loan/delete/${preapproved_loan.ID}`,
                        'type': 'get',
                        'success': function (data) {
                            notification('Loan deleted successfully','','success');
                            window.location.href = '/all-preapproved-loans';
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