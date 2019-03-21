let init = 0,
    count = 0,
    ids = [];

function notifications(){
    ids.length = 0;
    count = 0;
    status = false;
    $.ajax({
        type: "GET",
        url: "/notifications/new-updates?bug="+JSON.parse(localStorage.user_obj).ID,
        success: function (response) {
            status = true;
            init = response.length;
            if (response.length === 0){
                $('#noti-count').hide();
            }
            else{
                $('#noti-count').show();
                $('#noti-count').html(response.length);
            }
            let icon,
                link,
                item;
            $('#n-dropdown').empty();
            $.each(response, function (key, val) {
                count++;
                switch (val.category){
                    case 'Activity':
                        icon = '<i class="fa fa-tasks fa-4x"></i>'
                        link = '/activity'
                        break;
                    case 'Clients':
                        icon = '<i class="fa fa-users fa-4x"></i>'
                        link = '/client-info?id='+val.client;
                        break;
                    case 'Users':
                        icon = '<i class="fa fa-user fa-4x"></i>'
                        link = '#';
                        break;
                }
                let buttonid = 'but'+val.notification_id;
                item = '<div class="feed-body-content">\n' +
'                            <p class="feed-body-header">'+$.timeago(val.date_created)+'</time></p>\n' +
'                            <div class="row">\n' +
'                                <span class="col-md-3" style="padding-right: 0">'+icon+'</span>\n' +
'                                <a href="'+link+'" class="col-md-9" style="padding-left: 10px;font-size: 14px">'+val.description+'\n' +
'                                    <div class="client-notification">\n' +
'                                        <img class="user-avatar rounded-circle" src="images/admin.jpg" alt="User Avatar"\n' +
'                                             style="">\n' +
'                                            <p>'+val.user+'</p>\n' +
                    '                         <small role="button" onclick="markAsViewed('+val.notification_id+')" class="feed-content-menu float-right mark" style="margin-top: 50px" id="'+buttonid+'">Mark as Viewed</small>\n'+
'                                    </div>\n' +
'                                 </a>\n' +
'                            </div>\n' +
'                        </div>'
                $('#n-dropdown').append(item);
                // let obj = {};
                // obj.notification_id = val.notification_id;
                // obj.val = 2;
                //    $.ajax({
                //        type: "GET",
                //        url: "/notifications/update-pr",
                //        data:obj,
                //        success: function (response) {
                //            // console.log('Success');
                //            count = 0;
                //        }
                //    });
            });
            $('#noti-info').html(count+ ' unread notifications!');
        }
    });
}
setInterval(notifications, 5000);

let cats;
function list_categories(){
    $.ajax({
        type: "GET",
        url: "/notifications/categories",
        success: function (response) {
            cats = response;
            let count = response.length,
                item;
            $('#n-settings-panel').empty();
            $('#n-settings-panel').append('<h6>Manage Notifications</h6><br/>');
            for (let i = 0; i < count; i++){
                let v = response[i];
                if (v.compulsory === '1'){
                    item = '<input type="checkbox" id="act'+v.id+'" disabled="disabled"/>&nbsp;&nbsp;<label for = "'+v.category_name+'">'+v.category_name+'</label><hr/>'
                }
                else{
                    item = '<input type="checkbox" id="act'+v.id+'"/>&nbsp;&nbsp;<label for = "'+v.category_name+'">'+v.category_name+'</label><hr/>'
                }
                $('#n-settings-panel').append(item);
            }
            let button = '<button id="submit-settings" onclick="savePreferences()" class="btn btn-info fa-pull-right">Save <i class="fa fa-save"></i></button><br/>';
            $('#n-settings-panel').append(button);
        }
    });
}

function manage(){
    $('#n-settings-panel').slideDown('slow');
    list_categories();
    $('#n-dropdown').hide();
}

function savePreferences(){
    var obj = {};
    var arr = [];
    var i = 0; var j = 0;
    for (let a = 0; a < cats.length; a++){
        let rd; let wt;
        rt = ($('#act'+cats[a]["id"]).prop('checked')) ? 1 : 0;
        arr[a]=[cats[a]["id"], rt];
    }

    obj.userid = JSON.parse(localStorage.user_obj).ID;
    obj.cats = arr;
    var test = [];
    $.ajax({
        'url': 'notifications/savePreferences/'+JSON.parse(localStorage.user_obj).ID,
        'type': 'post',
        'data': obj,
        'success': function (data) {
            $.each(data, function (key, val) {
                test[key] = val;
            });
//                console.log(test);
            if(test.status == 500){
                swal("Failed!", "Error encountered. Please try again.", "error");
            }
            else
                swal("Success!", "Notification Preferences Set!", "success");
            $('#n-dropdown').slideUp('slow');
            $('#n-settings-panel').hide();
        }
    });
}

$( ".mark" ).click(function() {
    alert( "Handler for .click() called." );
});

function markAsViewed(id){
    let obj = {};
    obj.notification_id = id;
    obj.val = 3;
    $.ajax({
        type: "GET",
        url: "/notifications/update-pr",
        data:obj,
        success: function (response) {
        }
    });
}