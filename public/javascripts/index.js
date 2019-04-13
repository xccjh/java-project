$(document).ready(function() {
    eventHandler();
});

AV.initialize('EL7X31NKcy0GL7EpGumIyftY-gzGzoHsz', 'jQeM1g3Mfb3bSdJIiU37Gfnz');

var leanCloud = {//leanCloud的全局变量
    Member:AV.Object.extend('Member'),
    Supplies:AV.Object.extend('Supplies'),
    User:AV.Object.extend('UserList'),
    memberCatalogList:["clubId","name","department","position","college","grade","telNum","qqNum",],
    suppliesCatalogList:["clubId","name","amount","position","person","telNum","note"],
    tableNameMap:{"member":"Member","supplies":"Supplies"}
}

function eventHandler(){
    var _container = $('.container');
    var mainContent = $('.main-content');
    var _table = mainContent.find('table');
    var homeMainNavList = $('.home-main-nav-list');

    mainContent.on('click','.default-add-btn',function(e){//添加表格项
        var $this = $(this);
        var type = $this.data('type');
        showAddDialog(type);
    });

    _container.on('click','.table-add-close',function(){//关闭添加表格项的弹出框
        removeAddItemDialog();
    });

    mainContent.on('click','.home-main-nav-list',function(e){//主页标签切换
        var $this = $(this);
        var _type = $this.data('type');
        var panelList = $('.main-panel');
        $this.addClass('cur').siblings('.home-main-nav-list').removeClass('cur');

        panelList.each(function(index, el) {
            if(_type==index+1){
                $(this).show(200);
            }else{
                $(this).hide();
            }
        });
    })
    _container.on('click','.table-add-save-btn' ,function(){//添加新表格项消息
        var _addTable = $('.table-add-box');
        var _type = _addTable.data('type');
        var itemContent = [];
        var itemList = $('.table-add-content').find('input');
        var clubId = _table.data('clubid');
        itemContent.push(clubId);
        itemList.each(function(index, el) {
            itemContent.push($(this).val());
        });
        if(_type == "member"){
            var member = new leanCloud.Member();
            addNewTableItem(itemContent,leanCloud.memberCatalogList,member,_type);

        }else if(_type == "supplies"){
            var supplies = new leanCloud.Supplies();
            addNewTableItem(itemContent,leanCloud.suppliesCatalogList,supplies,_type);
        }
    });
    _container.on('click','.message-send-btn',function(){//发布留言
        var messageInpit = $('.message-text');
        var messageText = $.trim(messageInpit.val());
        var clubId = messageInpit.data('clubid');
        var msgStr = '';
        var msgListUl = $('.message-ul');
        var count = msgListUl.data('count');
        if(messageText!=""){
            $.ajax({
                url: '/leaveMsg',
                type: 'post',
                data: {messageText: messageText, clubId:clubId},
            })
            .done(function(data) {
                if(data.success == 1){
                    var time = formatTime(data.post.updatedAt);
                    msgStr = '<li class="message-list">' +
                        '<span class="message-user">' + data.post.user +'</span>' +
                        '<span class="message-time">'+ time +'</span>' +
                        '<span class="message-floor">'+ (count+1) +' #</span>'+
                        '<span class="message-content">'+data.post.msgText+'</span>' +
                    '</li>';
                    msgListUl.prepend(msgStr);
                }else{
                    alert(data.msg);
                }
               
            })
            .fail(function() {
                console.log("error");
            })
            .always(function() {
                console.log("complete");
            });
        }else{
            alert('请输入内容！');
        }
        
        
    });

    _container.on('click','.default-del-btn',function(){//删除表格项
        var delCheckBoxList = $('.table-choose:checked');
        var delList = delCheckBoxList.parents('tr');
        var sureDel = false;
        var type = _table.data('type');
        var tableName = leanCloud.tableNameMap[type];
        if(!delList.length){
            alert("请选择要删除的项");
        }else{
            sureDel = confirm("确认要删除吗？");
            if(sureDel){
                delList.each(function(index, el) {
                    var $this = $(this);
                    var _id = $this.data('id');
                    var delObj = AV.Object.createWithoutData(tableName, _id);
                    delObj.destroy().then(function() {
                      // 删除成功
                      $this.remove();
                    }, function(error) {
                      // 失败
                      console.log(error);
                    });
                });
                $('.table-choose-all').prop("checked",false);
            }
        }
    });

    _table.on('click','.modify-btn',function(e){//编辑表格项
        e.stopPropagation();
        e.preventDefault();
        var $this = $(this);
        var _item = $this.parents('tr');
        var _itemList = _item.find('td');
        var _id = _item.data('id');
        var type = _table.data('type');
        if(!_item.hasClass('modify-ing')){//从不是编辑状态编程编辑状态
            $this.text('保存');
            _item.addClass('modify-ing');
            _itemList.attr('contenteditable','true');
            _itemList.eq(1).focus();
        }else if(type=="member"){
            modifyTableItem("Member",_item,_id,leanCloud.memberCatalogList);
        }else if(type=="supplies"){
            modifyTableItem("Supplies",_item,_id,leanCloud.suppliesCatalogList);
        }
    });

    _table.on('click','.table-choose-all',function(){//表格项的全选和全不选
        var $this = $(this);
        var checkBoxList =  _table.find('.table-choose');
        var isChooseAll = $this.prop("checked");
        checkBoxList.each(function(index, el) {
            $(this).prop("checked",isChooseAll);
        });
    });

    _table.on('click','.table-choose',function(){
        var $this = $(this);
        var chooseAll = $('.table-choose-all');
        var isChoosedAll = chooseAll.prop("checked");//全选按钮是否选中
        var isAllChoosed = allCheckBoxChoosed();//下面的单选按钮是否全部选中
        if(isChoosedAll && !$this.prop("checked")){
            chooseAll.prop("checked",false);
        }else if(!isChoosedAll && isAllChoosed){//如果全选按钮没选，单选按钮都选中了，则把全选按钮选中
            chooseAll.prop("checked",true);
        }
    });

    $('.meeting-add-btn').on('click',function(){//新增会议记录
        var $this = $(this);
        $('.meeting-show').addClass('hide');
        $('.meeting-add-area').removeClass('hide');
    });

    $('.meeting-public-btn').on('click',function(e){//发布会议或活动记录
        var $this = $(this);
        var title = $('.meeting-add-title').val();
        var content = $('.meeting-add-content').val();
        var clubId = $this.data('clubid');
        var type = $this.data('type');
        var _url;
        if(type == "meeting"){
            _url = '/doPublicMeeting';
        }else{
            _url = '/doPublicActivity';
        }
        $.ajax({
            url: _url,
            type: 'post',
            data: {title: title,content:content,clubId:clubId},
        })
        .done(function(data) {
            if(data.success == 1){
                location.href = data.url;
            }else{
                alert(data.msg);
            }
        })
        .fail(function() {
            console.log("error");
        })
        .always(function() {
            console.log("complete");
        });
    });

    $('.meeting-modify-btn').on('click',function(){//编辑会议记录
        $('.meeting-per-show').addClass('hide');
        $('.meeting-modify-area').removeClass('hide');
    });

    $('.meeting-modify-cancel').on('click',function(){
        $('.meeting-per-show').removeClass('hide');
        $('.meeting-modify-area').addClass('hide');
    });

    $('.meeting-save-btn').on('click',function(){//保存修改的会议或活动记录
        var modifyArea = $('.meeting-modify-area');
        var recordId = modifyArea.data('recordid');
        var title = modifyArea.find('input').val();
        var content = modifyArea.find('textarea').val();
        var type = modifyArea.data('type');
        var objName;
        if(type == "meeting"){
            objName = 'Meeting';
        }else{
            objName = 'Activity';
        }
        // 知道 objectId，创建 AVObject
        var post = AV.Object.createWithoutData(objName, recordId);
        post.fetchWhenSave(true);
        // 保存
        post.save({
            title:title,
            content:content
        }).then(function() {
          // 保存成功
            location.reload();
        }, function(error) {
          // 失败
          console.log(error);
          alert("保存编辑失败，请稍后再试~");
        });
    });

    $('.meeting-del-btn').on('click',function(){//删除会议或活动记录
        var $this = $(this);
        var recordArea = $('.meeting-per-show');
        var recordId = recordArea.data('recordid');
        var type = recordArea.data('type');
        var objName;
        if(type == "meeting"){
            objName = 'Meeting';
        }else{
            objName = 'Activity';
        }
        var recordObj = AV.Object.createWithoutData(objName, recordId);
        var listUrl = $('.meeting-return-url').attr('href');
        if(confirm("确认要删除吗?")){
            recordObj.destroy().then(function() {
              // 删除成功
              location.href = listUrl;
            }, function(error) {
              // 失败
              console.log(error);
            });
        }
    });
    $('#join_club_btn').on('click',function(){//申请加入社团
        var $this = $(this);
        var clubId = $this.data('clubid');
        $.ajax({
            url: '/joinClub',
            type:'post',
            data: {clubId: clubId},
        })
        .done(function(data) {
            location.reload();
        })
        .fail(function() {
            console.log("error");
        })
        .always(function() {
            console.log("complete");
        });
        
    });

    $('.reg-form').on('click','.form-submit-btn',function(e){
        e.preventDefault();
        var thisForm = $('.reg-form');
        var thisFormType = thisForm.data('type');
        var testFormResult = testForm(thisForm);
        var username = $('#username').val();
        var password = $('#password').val();

        if(!testFormResult.flag){//表单验证不通过时，弹出提示信息
            alert(testFormResult.msg);
        }else{
            if(thisFormType == 'reg'){//用户注册
                var user = new AV.User();
                user.set('username', username);
                user.set('password', password);
                user.set('clubArr', []);
                user.signUp().then(function(user) {
                  // 注册成功，可以使用了
                    alert('注册成功');
                    location.href = '/login/';
                }, function(error) {
                  // 失败了
                  console.log('Error: ' + error.code + ' ' + error.message);
                  alert(error.message);
                });
            }else if(thisFormType == 'login'){//用户登录
                $.ajax({
                    url: '/doLogin',
                    type: 'post',
                    data: {username: username, password:password},
                })
                .done(function(data) {
                    if(data.status == 1){
                        location.href = data.url;
                    }else if(data.status == 0 ){
                        alert(data.msg);
                    }
                })
                .fail(function() {
                    console.log("error");
                })
                .always(function() {
                    console.log("complete");
                });
                
            }
        }
    });
}
/*
 * modifyTableItem()保存修改的表格项内容
 * tableName:需要查询的表名。item:要修改的tr对象，id:需要修改的id。
 */
function modifyTableItem(tableName,item,id,itemCatalog){
    var newItemContent = [];
    var _tableName = tableName;
    var _item = item;
    var _itemList = _item.find('td');
    var _id = id;
    var _itemCatalog = itemCatalog;
    var clubId = $('table').data('clubid');
    newItemContent.push(clubId);
    _itemList.each(function(index, el) {
        if(index>0){
            newItemContent.push($(this).text());
        }
    });
    // 知道 objectId，创建 AVObject
    var post = AV.Object.createWithoutData(_tableName, _id);
    post.fetchWhenSave(true);
    for(var i=0,len=_itemCatalog.length;i<len;i++){
        post.set(_itemCatalog[i],newItemContent[i]);
    }
    // 保存
    post.save().then(function() {
      // 保存成功
      _item.removeClass('modify-ing');
      _item.find('.modify-btn').text('编辑');
      _itemList.removeAttr('contenteditable');
    }, function(error) {
      // 失败
      alert("保存编辑失败，请稍后再试~");
    });
}

/*
 * addNewTableItem(itemContent,itemCatalog)，添加新的表格项。
 * itemContent相当于是td的部分，itemCatalog相当于是th的部分。都是数组形式传入。
 * subClass是对应的子类
 */
function addNewTableItem(itemContent,itemCatalog,subClass,type){
    var _table = $('table');
    var _addTable = $('.table-add-box');
    var _subClass = subClass;
    var _itemCatalog = itemCatalog;//表格项目录标题
    var _itemContent = itemContent;//表格项内容
    var _type = type;
    for(var i=0,len=_itemCatalog.length;i<len;i++){
        _subClass.set(_itemCatalog[i],_itemContent[i]);
    }
    _subClass.save().then(function(post) {
      // 实例已经成功保存.
        var newItemStr = '<tr data-id="'+ post.id +'"> ' +
            '<td><input type="checkbox" class="table-choose"></td>';

        for(var i=0,len=_itemContent.length;i<len;i++){
            if(_itemCatalog[i]!="clubId"){
                newItemStr+= '<td>'+ post.attributes[_itemCatalog[i]] +'</td>';
            }   
        }
            newItemStr+='<td><button class="btn-success btn-s modify-btn">编辑</button></td>'+
        '</tr>';
            
        _table.find('tbody').append(newItemStr);
        removeAddItemDialog();
    }, function(err) {
       // 失败了.
       console.log(err);
       alert("添加失败，请稍后再试~");
    });
}

function allCheckBoxChoosed(){
    var checkBoxList = $('.table-choose');
    var flag = true;
    checkBoxList.each(function(index, el) {
        if(!$(this).prop("checked")){
            flag = false;
            return;
        }
    });
    return flag;
}

function removeAddItemDialog(){//移除添加表格项的弹出框
    $('.table-add-box').remove();
    $('.mask').hide();
}

function showAddDialog(type){//添加表格项的弹出框
    var item;
    var container = $('.container');
    if(type == 'member'){
        item = ['姓名','部门','职位','学院','年级','电话','QQ'];
    }else if(type == 'supplies'){
        item = ['物品名称','数量','所在地点','负责人','负责人电话','备注'];
    }
    var htmlStr = '<div class="table-add-box" data-type="'+ type +'">' + 
                    '<h4 class="table-add-tit">请输入需要添加的项目信息</h4>' +
                    '<span class="table-add-close">x</span>' +
                    '<div class="table-add-content">';

    for(var i = 0,len = item.length; i < len ; i++){
        htmlStr +='<label>'+ item[i] + '：<input type="text"></label>';
    }
    htmlStr +=  '</div>' +
                '<button class="table-add-save-btn btn-success btn-m">确&nbsp;&nbsp;定</button>'+
                '</div>';
    $('.mask').show();
    container.append(htmlStr);
}



function testForm(form){//验证登录注册的表单是否正确
    var username = $('#username').val();
        var password = $('#password').val();
        var passwordRepeat = $('#password-repeat').val();
    var inputList = form.find('input');
    var inputListMap = {"username":"用户名","password":"密码","password-repeat":"密码again"};
    var result = {
        flag : true,
        msg : '验证通过'
    };

    inputList.each(function(index, el) {//非空验证
        var $this = $(this);
        var thisType = $this.attr("name");
        if($this.val()==""){
           result = {
            flag : false,
            msg : '请输入'+inputListMap[thisType]
           } 
            return false;
        }
    });

    if(passwordRepeat && password!= passwordRepeat){
        result = {
            flag : false,
            msg : '两次输入的密码不一致'
           }
    }
    return result;
}

function formatTime(time){
    var date = new Date(time);
    var year = date.getFullYear();
    var month = date.getMonth()+1 > 9 ? date.getMonth()+1 :'0' + (date.getMonth()+1) ;
    var day = date.getDate() > 9 ? date.getDate() :'0' + date.getDate() ;
    var hour = date.getHours() > 9 ? date.getHours() :'0' + date.getHours() ;
    var minute = date.getMinutes() > 9 ? date.getMinutes() :'0' + date.getMinutes() ;
    var second = date.getSeconds() > 9 ? date.getSeconds() :'0' + date.getSeconds() ;
    
    return  year + '-' + month + '-' + day + ' ' + hour +':'+ minute + ':' + second;
}