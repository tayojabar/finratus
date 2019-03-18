$(document).ready(function () {
    includeHTML();
    const $body = $('body');
    $body.delegate('#menuToggle','click', function(event) {
        $('body').toggleClass('open');
    });
    $body.delegate('.search-trigger','click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        $('.search-trigger').parent('.header-left').addClass('open');
    });
    $body.delegate('.search-close','click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        $('.search-trigger').parent('.header-left').removeClass('open');
    });
});

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

function read_write() {
    let w,
        perms = JSON.parse(localStorage.getItem("permissions")),
        page = (window.location.pathname.split('/')[1].split('.'))[0];
    perms.forEach(function (k, v) {
        if (k.module_name === page) {
            w = $.grep(perms, function (e) {
                return e.id === parseInt(k.id);
            });
        }
    });
    if (w && w[0] && (parseInt(w[0]['editable']) !== 1))
        $(".write").hide();
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

function includeHTML() {
    let z, i, elmnt, file, xhttp;
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
        elmnt = z[i];
        file = elmnt.getAttribute("include-html");
        if (file) {
            xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {elmnt.innerHTML = this.responseText;}
                    if (this.status === 404) {elmnt.innerHTML = "Page not found.";}
                    elmnt.removeAttribute("include-html");
                    includeHTML();
                }
            };
            xhttp.open("GET", file, true);
            xhttp.send();
            return;
        }
    }
    check();
    read_write();
    loadMenus();
}

function logout() {
    localStorage.login = "0";
    window.location.href = "/logout";
}