const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session'); 
const MongoStore = require('connect-mongo')(session);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//设置会话以及会话存储，此处后续需要好好研究下
app.use(session({
  secret: 'kalot_wang',
  cookie: {
    domain: 'localhost',  //注意生产环境下需换成主机名或主机IP
    path: '/',
    httpOnly: true,
    secure: false,
    maxAge: null
  },
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({url: 'mongodb://localhost:27017/microblog'})
}));

app.locals.page_date = new Date().getFullYear();
app.locals.custom_css = '';
app.locals.error = '';

app.use(function(req, res, next) {
  app.locals.user = req.session.user;
  console.log('user is', app.locals.user);
  next();
});

var indexRouter = require('./routes/index.js');
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/*app.listen(8080, 'localhost', ()=>{
  console.log('The server is listening at port 8080.');
});*/

module.exports = app;
