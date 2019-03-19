let init = 0;
function notifications(){
    status = false;
    $.ajax({
        type: "GET",
        url: "/notifications/new-updates",
        success: function (response) {
            status = true;
            $('#noti-info').html('You have '+((init === 0)? 0 : (response.length - init))+ ' new notifications');
            init = response.length;
            $('#noti-count').html(response.length);
            let count = 0,
                icon,
                item;
            $('#n-dropdown').empty();
            $.each(response, function (key, val) {
                count++;
                switch (val.category){
                    case 'Activity':
                        icon = '<i class="fa fa-tasks"></i>'
                        break;
                    case 'Clients':
                        icon = '<i class="fa fa-users"></i>'
                        break;
                    case 'Users':
                        icon = '<i class="fa fa-user"></i>'
                        break;
                }
                // item = '<a class="dropdown-item" href="/dashboard">'+icon+'\n' +
                //     '<p style="width: auto">'+val.description+'</p>\n' +
                //     '</a>' +
                //     // '<button class="fa-pull-right" style="margin-top: -30px; margin-right: 15px">Mark as viewed!</button>'+
                //     '<input class="fa-pull-right" style="margin-top: -25px; margin-right: 15px" type="checkbox" />'+
                //     '<hr/>';
                item = '<div class="feed-body-content">\n' +
'                            <p class="feed-body-header">Just Now</p>\n' +
'                            <div class="row">\n' +
'                                <span class="col-md-3" style="padding-right: 0"><img src="atb-logo.png"></span>\n' +
'                                <span class="col-md-9" style="padding-left: 10px;font-size: 14px"> Rawdenim youprobably haven\'t heard of them jean shorts Austin.\n' +
'                                    <div class="client-notification">\n' +
'                                        <img class="user-avatar rounded-circle" src="images/admin.jpg" alt="User Avatar"\n' +
'                                             style="">\n' +
'                                            <p>David Becham</p>\n' +
'                                        <div class="feed-content-menu float-right" id=""\n' +
'                                             data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">...</div>\n' +
'                                    </div>\n' +
'                                 </span>\n' +
'                            </div>\n' +
'                            <div class="feed-content-menu-drp-dwn d-none" id="feed-content-menu-drp-dwn"\n' +
'                                 aria-labelledby="dropdownMenuButton">\n' +
'                                <a class="dropdown-item" href="#">Action</a>\n' +
'                                <a class="dropdown-item" href="#">Another action</a>\n' +
'                                <a class="dropdown-item" href="#">Something else here</a>\n' +
'                            </div>\n' +
'                        </div>'
                $('#n-dropdown').append(item);
                let obj = {};
                obj.notification_id = val.notification_id;
                   $.ajax({
                       type: "GET",
                       url: "/notifications/update-pr",
                       data:obj,
                       success: function (response) {
                           console.log('Success');
                       }
                   });
            });

        }
    });
}

setInterval(notifications, 5000);