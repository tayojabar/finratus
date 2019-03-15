var table = {};
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

function onRequirement(value) {
    $("#viewRequirementModalHeader").html(`${value} Requirement`);

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
                    <button class="dropdown-item" type="button" data-toggle="modal" data-target="#viewRequirementModal" onclick="onRequirement('${full.name}')">Requirement</button>
                    </div>
                </div>`;
                }
            }
        ]
    });


}