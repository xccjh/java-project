var express = require('express');
var router = express.Router();
var AV = require('avoscloud-sdk');
var app = express();
var ApplyJoin = AV.Object.extend('ApplyJoin');
AV.initialize('EL7X31NKcy0GL7EpGumIyftY-gzGzoHsz', 'jQeM1g3Mfb3bSdJIiU37Gfnz');


router.get('/', function(req, res, next){
	getPageClubList(req, res, next);
	req.session.url = req.originalUrl;
});
/* GET home page. */
router.get('/clubId/:clubId', function(req, res, next){
	getPageHome(req, res, next);
	req.session.url = req.originalUrl;
});
router.get('/clubId/:clubId/meeting', function(req, res, next) {
	getPageMeetingOrActivity(req,res,next,'meeting');
	req.session.url = req.originalUrl;
});
router.get('/clubId/:clubId/activity', function(req, res, next) {
	getPageMeetingOrActivity(req,res,next,'activity');
	req.session.url = req.originalUrl;
});
router.get('/clubId/:clubId/meeting/:id', function(req, res, next) {
	getSingleMeetingOrActivity(req, res, next,'meeting');
	req.session.url = req.originalUrl;
});
router.get('/clubId/:clubId/activity/:id', function(req, res, next) {
	getSingleMeetingOrActivity(req, res, next,'activity');
	req.session.url = req.originalUrl;
});
router.post('/doLogin',function(req,res){//用户登录
    doLogin(req,res);
});

router.get('/quit',function(req,res){//退出登录
	delete req.session.user;
	AV.User.logOut();
	return res.redirect(req.session.url);
});

router.get('/clubId/:clubId/members', function(req, res, next) {
	getPageClubMembers(req,res,next);
	req.session.url = req.originalUrl;
});

router.get('/clubId/:clubId/supplies', function(req, res, next) {
	getPageSupplies(req,res,next);
	req.session.url = req.originalUrl;
});

router.get('/clubId/:clubId/message', function(req, res, next) {
	getPageMessage(req,res,next);
	req.session.url = req.originalUrl;
});

router.get('/login', function(req, res, next) {
	res.render('login', { title: '登录-社团管理系统',tab:1});
});

router.get('/reg', function(req, res, next) {
	res.render('reg', { title: '注册-社团管理系统',tab:1});
});

router.post('/leaveMsg', function(req, res) {
	doLeaveMsg(req, res);
});

router.post('/doPublicMeeting', function(req, res,next) {
	doPublicMeetingOrActivity(req, res,next,'meeting');
});

router.post('/doPublicActivity', function(req, res,next) {
	doPublicMeetingOrActivity(req, res,next,'activity');
});
router.post('/doPublicActivity', function(req, res,next) {
	doPublicMeetingOrActivity(req, res,next,'activity');
});
router.post('/joinClub', function(req, res,next) {
	doJoinClub(req, res,next);
});

function getPageHome(req, res, next){//首页的渲染函数
	var clubId = parseInt(req.params.clubId);
	var memberQuery = new AV.Query('Member');
	var clubQuery = new AV.Query('Club');
	var activityQuery = new AV.Query('Activity');
	var messageQuery = new AV.Query('Message');
	var memberList,clubInfo,activityList,messageList;
	memberQuery.equalTo('clubId', clubId);
	clubQuery.equalTo('clubId', clubId);
	activityQuery.equalTo('clubId', clubId).limit(5).descending('createdAt');
	messageQuery.equalTo('clubId', clubId).limit(5).descending('createdAt');
	AV.Promise.when(
		judgeTheAuthority(clubId),
		memberQuery.find(),
		clubQuery.first(),
		activityQuery.find(),
		messageQuery.find()
	).then(function(authority,memberResult,clubResult,activityList,messageList){
		memberList = memberResult;
		clubInfo = clubResult;
		res.locals.clubId = clubId;
		res.render('home', { 
			title: clubInfo.attributes.clubName+'社团主页',
			tab:1,
			authority:authority,
			memberList:memberList,
			activityList:activityList,
			messageList:messageList,
			clubInfo:clubInfo
		});
	}, function(error) {
		// 失败
		console.log(error);
		res.render('home', { title: '首页-社团管理系统',tab:1,memberList:memberList});
	});
}

function doLogin(req,res){
	var username = req.body.username;
	var password = req.body.password;
	AV.User.logIn(username, password).then(function() {
	  req.session.user = {
	 	name : username
	  }
	  res.send({
	  	status:1,
	  	msg:'登录成功',
	  	url:req.session.url 
	  });
	}, function(err) {
	  // 失败了
	  res.send({
	  	status:0,
	  	msg:err.message
	  })
	});
}

function getPageClubList(req,res,next){//社团列表页面路由
	var clubQuery = new AV.Query('Club');
	var clubList;
	clubQuery.find().then(function(results) {
	  // each of results will only have the selected fields available.
	  	clubList = results;
		res.render('index', { title: '首页-社团管理系统',tab:1,clubList:clubList});
	}, function(error) {
	  // 失败
	  console.log(error);
	  clubList = [];
	  res.render('index', { title: '首页-社团管理系统',tab:1,clubList:clubList});
	});
}

function getPageClubMembers(req,res,next){//社团成员渲染
	var clubId = parseInt(req.params.clubId);
	var query = new AV.Query('Member');
	var memberList;
	query.equalTo('clubId',clubId);
	AV.Promise.when(
		judgeTheAuthority(clubId),
		query.find()
	).then(function(authority,results){
	  memberList = results;
	  res.locals.clubId = clubId;
	  res.render('members', { title: '社团成员-社团管理系统',tab:2, memberList:memberList,authority:authority});
	}, function(error) {
	  // 失败
	  console.log(error);
	  memberList = [];
	  res.render('members', { title: '社团成员-社团管理系统',tab:2, memberList:memberList,errorMsg:'xxxx'});
	});
	
}

function getPageSupplies(req,res,next){//物资管理系统的渲染
	var clubId = parseInt(req.params.clubId);
	var query = new AV.Query('Supplies');
	var suppliesList;
	query.equalTo('clubId',clubId);
	AV.Promise.when(
		judgeTheAuthority(clubId),
		query.find()
	).then(function(authority,results) {
	  // each of results will only have the selected fields available.
	  suppliesList = results;
	  res.locals.clubId = clubId;
	  res.render('supplies', { 
	  	title: '物资管理-社团管理系统',
	  	tab:3, 
	  	suppliesList:suppliesList,
	  	authority:authority
	  });
	}, function(error) {
	  // 失败
	  console.log(error);
	  suppliesList = [];
	  res.render('supplies', { title: '物资管理-社团管理系统',tab:3, suppliesList:suppliesList,error:error});
	});
}

function doLeaveMsg(req,res,next){
	var msgText = req.body.messageText;
	var clubId = parseInt(req.body.clubId);
	if(req.session.user){
		var user = req.session.user.name;
	}
	var Message = AV.Object.extend('Message');
	var message = new Message();
	if(user){
		message.save({
		  msgText: msgText,
		  user: user,
		  clubId:clubId
		}).then(function(post) {
		  // 实例已经成功保存.
		  res.send({success:1,msg:'留言成功发布',post:post})
		}, function(err) {
		  // 失败了.
		  res.send({success:0,msg:err.message})
		});
	}else{
		res.send({success:0,msg:'您没有登录，请登录！'})
	}
}

function getPageMessage(req,res,next){//留言板渲染函数
	var clubId = parseInt(req.params.clubId);
	var msgQuery = new AV.Query('Message');
	var messageList;
	msgQuery.equalTo('clubId',clubId);
	msgQuery.addDescending('createdAt');
	msgQuery.find().then(function(results) {
	  // each of results will only have the selected fields available.
	  messageList = results;
	  res.locals.clubId = clubId;
	  res.render('message', { title: '留言板-社团管理系统',tab:4, messageList:messageList});
	}, function(error) {
	  // 失败
	  console.log(error);
	  messageList = [];
	  res.render('message', { title: '留言板-社团管理系统',tab:4, messageList:messageList,error:error});
	});
}

function getPageMeetingOrActivity(req,res,next,type){
	var clubId = parseInt(req.params.clubId);
	var clubQuery = new AV.Query('Club');
	var query,renderName,renderTitle;
	if(type == "meeting"){
		query = new AV.Query('Meeting');
		renderName = 'meeting';
		renderTitle = '会议记录';
	}else{
		query = new AV.Query('Activity');
		renderName = 'activity';
		renderTitle = '活动记录';
	}
	var clubInfo,resultList;
	clubQuery.equalTo('clubId', clubId);
	query.equalTo('clubId', clubId);
	query.addDescending('updatedAt');
	AV.Promise.when(
		judgeTheAuthority(clubId),
		clubQuery.first(),
		query.find()
	).then(function(authority,clubResults,results) {
		clubInfo = clubResults;
		res.locals.clubId = clubId;
		resultList = results;
		res.render(renderName, { 
			title: clubInfo.attributes.clubName + renderTitle,
			tab:1,
			clubInfo:clubInfo,
			isSingle:false,
			authority:authority,
			resultList:resultList
		});
	}, function(error) {
		// 失败
		console.log(error);
		res.render(renderName, { title: '首页-社团管理系统',tab:1});
	});
}

function doPublicMeetingOrActivity(req,res,next,type){
	var title = req.body.title;
	var content = req.body.content;
	var clubId = parseInt(req.body.clubId);
	var publicObj;
	if(type == "meeting"){
		publicObj =  AV.Object.extend('Meeting');
	}else{
		publicObj =  AV.Object.extend('Activity');
	}
	if(req.session.user){
		var user = req.session.user.name;
	}
	var obj = new publicObj();
	if(user){
		obj.save({
		  title: title,
		  content:content,
		  user: user,
		  clubId:clubId
		}).then(function(post) {
		  // 实例已经成功保存.
		  res.send({success:1,msg:'记录发布成功',post:post,url:req.session.url})
		}, function(err) {
		  // 失败了.
		  res.send({success:0,msg:err.message})
		});
	}else{
		res.send({success:0,msg:'您没有登录，请登录！'})
	}
}


function getSingleMeetingOrActivity(req,res,next,type){//获取单个记录
	var queryId = req.params.id;
	var query,renderName,renderTitle;
	if(type == "meeting"){
		query = new AV.Query('Meeting');
		renderName = 'meeting';
		renderTitle = '会议记录';
	}else{
		query = new AV.Query('Activity');
		renderName = 'activity';
		renderTitle = '活动记录';
	}
	var clubId = parseInt(req.params.clubId);
	var clubQuery = new AV.Query('Club');
	var clubInfo,result;
	clubQuery.equalTo('clubId', clubId);
	query.equalTo('objectId', queryId);
	AV.Promise.when(
		judgeTheAuthority(clubId),
		clubQuery.first(),
		query.first()
	).then(function(authority,clubResults,results){
		clubInfo = clubResults;
	  	res.locals.clubId = clubId;
	  	result = results;
	  	res.render(renderName, { 
		  	title: clubInfo.attributes.clubName + renderTitle,
		  	tab:1,
		  	isSingle:true,
		  	clubInfo:clubInfo,
		  	authority:authority,
		  	result:result
		});
	},function(error) {
		// 失败
		console.log(error);
		res.render(renderName, { title: '首页-社团管理系统',tab:1});
	});
}

function isTheClubMember(clubId,user){//判断当前用户是否是该社团成员
	var currentUser = user;
	var clubArr = [];
	if (currentUser){
		clubArr = currentUser.attributes.clubArr;
		return isInArray(clubId,clubArr);
	}else{
		return false;
	}
}

function judgeTheAuthority(clubId){//判断当前用户的权限
	var promise = new AV.Promise();
	var _clubId = clubId;
	var currentUser = AV.User.current();
	var authorityQuery = new AV.Query('Club');
	var applyQuery = new AV.Query('ApplyJoin');
	var authority = {
		isMember : false,
		editMember : false,
		editSupplies: false,
		pubMeeting: false,
		pubActivity: false,
		isApplying: false,
		isOwner : false
	};
	if(!currentUser){//如果没有登录，则全部返还false
		promise.resolve(authority);
	}else{
		var username = currentUser.attributes.username;
		if(isTheClubMember(_clubId,currentUser)){
			authority.isMember = true;
		}
		authorityQuery.equalTo('clubId', _clubId);
		applyQuery.equalTo('username', username);
		applyQuery.equalTo('clubId', _clubId);
		AV.Promise.when(
			authorityQuery.first(),
			applyQuery.find()
		).then(function(authorityResult,apply){
			var _authority = authorityResult.attributes;
			if(isInArray(username,_authority.managers)){
				authority.isOwner = true;
			}
			if(isInArray(username,_authority.canEditMember)){
				authority.editMember = true;
			}
			if(isInArray(username,_authority.canEditSupplies)){
				authority.editSupplies = true;
			}
			if(isInArray(username,_authority.canPubMeeting)){
				authority.pubMeeting = true;
			}
			if(isInArray(username,_authority.canPubActivity)){
				authority.pubActivity = true;
			}
			if(apply.length){
				authority.isApplying = true;
			}
			console.log(authority)
			promise.resolve(authority);
		});
	}
	return promise;
}

function isInArray(value,array){//判断值是否在数组里
	return array.toString().indexOf(value) > -1;
}

function doJoinClub(req,res,next){//申请加入社团
	var currentUser = AV.User.current();
	var clubId = parseInt(req.body.clubId);
	var applyJoin = new ApplyJoin();
	var username = currentUser.attributes.username;
	var result = {};
	applyJoin.set('clubId',clubId);
	applyJoin.set('username',username);
	applyJoin.save().then(function (todo) {
		result = {
			status : 1,
			message: '保存成功'
		}
      	res.send(result);
    }, function (error) {
    	result = {
			status : 0,
			message: error.message
		}
		res.send(result);
   });// 保存到云端
	
}
module.exports = router;
