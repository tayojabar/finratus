function check() {
    if (localStorage.getItem('role') !== 1) {
        jQuery('#car-models').hide();
        jQuery('#new-user').hide();
        jQuery('#models-card').hide();
        jQuery('#user').html(localStorage.getItem("name"));
    } else {
        jQuery('#user').html(localStorage.getItem("name"));
    }
}

function loadUsers(id) {
    let start = $("#startDate").val(),
        end = $("#endDate").val(),
        uid = id || '',
        url;
    url = (start === "" || start === null || end === "" || end === null) ? 'user/clients-list-full/' + uid :
        'user/clients-list-full/' + uid + '?start=' + start + '&&end=' + end;
    $('#wait').show();
    $.ajax({
        'url': url,
        'type': 'get',
        'success': function (data) {
            $('#wait').hide();
            let users = JSON.parse(data);
            results = users;
            populateDataTable(users);
        },
        'error': function (err) {
            $('#wait').hide();
            console.log('Error');
        }
    });

}

function read_write() {
    let w;
    var perms = JSON.parse(localStorage.getItem("permissions"));
    var page = (window.location.pathname.split('/')[1].split('.'))[0];
    perms.forEach(function (k, v) {
        if (k.module_name === page) {
            w = $.grep(perms, function (e) {
                return e.id === parseInt(k.id);
            });
        }
    });
    if (w && w[0] && (parseInt(w[0]['editable']) !== 1)) {
        $(".write").hide();
    }
}

function loadMenus() {
    let modules = {};
    modules = JSON.parse(localStorage.getItem("modules"));
    modules.forEach(function (k, v) {
        if (k.menu_name === 'Sub Menu') {
            let main = $.grep(modules, function (e) {
                return e.id === parseInt(k.main_menu);
            });
            $('#' + $(main[0]['module_tag']).attr('id') + ' > .sub-menu').append(k.module_tag);
        } else if (k.menu_name === 'Main Menu') {
            $('#sidebar').append(k.module_tag);
            $('#' + $(k.module_tag).attr('id')).append(
                '<ul class="sub-menu children dropdown-menu"></ul>');
        } else {
            $('#' + k.module_name).show();
        }
    });
    $.ajax({
        type: "GET",
        url: "/user/all-requests",
        success: function (response) {
            $.each(response, function (k, v) {
                $('#requests-badge').html(v.requests);
            });
        }
    });
    $.ajax({
        type: "GET",
        url: "/user/all-applications",
        success: function (response) {
            $.each(response, function (k, v) {
                $('#applications-badge').html(v.applications);
            });
        }
    });
}
