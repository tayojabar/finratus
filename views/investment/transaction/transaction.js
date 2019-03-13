var table = {};
$(document).ready(function () {
    $('#bootstrap-data-table-export').DataTable();
    var sPageURL = window.location.search.substring(1);
    if (sPageURL !== "") {
        var sURLVariables = sPageURL.split('=')[1];
        if (sURLVariables !== "") {
            bindDataTable(sURLVariables);
        }
    }

});

let _table = $('#bootstrap-data-table-export').DataTable();

function bindDataTable(id) {
    table = $('#bootstrap-data-table2').DataTable({
        dom: 'Blfrtip',
        bProcessing: true,
        bServerSide: true,
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        fnServerData: function (sSource, aoData, fnCallback) {
            let tableHeaders = [{
                    name: "txn_date",
                    query: `ORDER BY STR_TO_DATE(v.txn_date, '%Y-%m-%d') ${aoData[2].value[0].dir}`
                },
                {
                    name: "ref_no",
                    query: `ORDER BY v.ref_no ${aoData[2].value[0].dir}`
                },
                {
                    name: "description",
                    query: `ORDER BY v.description ${aoData[2].value[0].dir}`
                },
                {
                    name: "amount",
                    query: `ORDER BY amount ${aoData[2].value[0].dir}`
                }, {
                    name: "amount",
                    query: `ORDER BY v.amount ${aoData[2].value[0].dir}`
                }, {
                    name: "balance",
                    query: `ORDER BY v.balance ${aoData[2].value[0].dir}`
                }
            ];
            $.ajax({
                dataType: 'json',
                type: "GET",
                url: `/investment-service/client-investments/${id}`,
                data: {
                    limit: aoData[4].value,
                    offset: aoData[3].value,
                    draw: aoData[0].value,
                    search_string: aoData[5].value.value,
                    order: tableHeaders[aoData[2].value[0].column].query
                },
                success: function (data) {
                    if (aoData[3].value === 0) {
                        $("#client_name").html(data.data[0].fullname);
                        $("#inv_name").html(`${data.data[0].name} (${data.data[0].code})`);
                    }
                    fnCallback(data)
                }
            });
        },
        aoColumnDefs: [{
                sClass: "numericCol",
                aTargets: [3]
            },
            {
                sClass: "numericCol",
                aTargets: [5]
            }
        ],
        columns: [{
                data: "txn_date",
                width: "auto"
            },
            {
                data: "ref_no",
                width: "auto"
            },
            {
                data: "description",
                width: "auto"
            },
            {
                width: "auto",
                "mRender": function (data, type, full) {
                    return `<span style="color:green">${(full.is_credit === 1) ? full.amount : ""}</span>`;
                }
            }, {
                width: "auto",
                "mRender": function (data, type, full) {
                    return `<span style="color:red">${(full.is_credit === 0) ? full.amount : ""}</span>`;
                }
            },
            {
                data: "balance",
                width: "auto"
            }
        ]
    });
}

$(document).ready(function () {});

$(document).ajaxStart(function () {
    $("#wait").css("display", "block");
});

$(document).ajaxComplete(function () {
    $("#wait").css("display", "none");
});