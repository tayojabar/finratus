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
                        icon = '<i class="fa fa-tasks fa-4x"></i>'
                        break;
                    case 'Clients':
                        icon = '<i class="fa fa-users fa-4x"></i>'
                        break;
                    case 'Users':
                        icon = '<i class="fa fa-user fa-4x"></i>'
                        break;
                }
                item = '<div class="feed-body-content">\n' +
'                            <p class="feed-body-header">'+$.timeago(val.date_created)+'</time></p>\n' +
'                            <div class="row">\n' +
'                                <span class="col-md-3" style="padding-right: 0">'+icon+'</span>\n' +
'                                <span class="col-md-9" style="padding-left: 10px;font-size: 14px">'+val.description+'\n' +
'                                    <div class="client-notification">\n' +
'                                        <img class="user-avatar rounded-circle" src="images/admin.jpg" alt="User Avatar"\n' +
'                                             style="">\n' +
'                                            <p>'+val.user+'</p>\n' +
'                                        <div class="feed-content-menu float-right" id=""\n' +
'                                             data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">...</div>\n' +
'                                    </div>\n' +
'                                 </span>\n' +
'                            </div>\n' +
'                            <div class="feed-content-menu-drp-dwn d-none" id="feed-content-menu-drp-dwn"\n' +
'                                 aria-labelledby="dropdownMenuButton">\n' +
'                                <a class="dropdown-item" href="#">Hide</a>\n' +
'                                <a class="dropdown-item" href="#">Mark as Viewed</a>\n' +
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