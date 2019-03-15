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
                item = '<a class="dropdown-item" href="/dashboard">'+icon+'\n' +
                    '<p style="width: auto">'+val.description+'</p>\n' +
                    '</a>' +
                    // '<button class="fa-pull-right" style="margin-top: -30px; margin-right: 15px">Mark as viewed!</button>'+
                    '<input class="fa-pull-right" style="margin-top: -25px; margin-right: 15px" type="checkbox" />'+
                    '<hr/>';
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