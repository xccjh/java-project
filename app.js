var AV = require('avoscloud-sdk');
AV.initialize('EL7X31NKcy0GL7EpGumIyftY-gzGzoHsz', 'jQeM1g3Mfb3bSdJIiU37Gfnz');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var partials = require('express-partials');
var routes = require('./routes/index');
//会话支持
var connect = require('connect');
var session = require('express-session');
var ejs = require('ejs');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(partials());
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: '12345',
    name: 'testapp',   //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    cookie: {maxAge: 80000 },  //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
    resave: false,
    saveUninitialized: true,
}));



//使用中间件把user设置成动态视图助手
app.use(function(req,res,next){
  var currentUser = AV.User.current();
  if (currentUser) {
    req.session.user = {
      name:currentUser.attributes.username
    }
  }
    res.locals.user = req.session.user;
    next();
});

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.locals['formatTime'] = function(time){ 
    var date = new Date(time);
    var year = date.getFullYear();
    var month = date.getMonth()+1 > 9 ? date.getMonth()+1 :'0' + (date.getMonth()+1) ;
    var day = date.getDate() > 9 ? date.getDate() :'0' + date.getDate() ;
    var hour = date.getHours() > 9 ? date.getHours() :'0' + date.getHours() ;
    var minute = date.getMinutes() > 9 ? date.getMinutes() :'0' + date.getMinutes() ;
    var second = date.getSeconds() > 9 ? date.getSeconds() :'0' + date.getSeconds() ;
    
    return  year + '-' + month + '-' + day + ' ' + hour +':'+ minute + ':' + second;
};

module.exports = app;
