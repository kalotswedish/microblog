const express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Post = require('../models/post.js');
var encryptData = require('../models/pass.js').encryptData;
var has_logged_in = false;

//判断用户是否已登录
router.use(function(req, res, next) {
  if (req.session.user) {
    has_logged_in = true;
  }
  next();
});

//对于所有在规划内的路径，该怎么处理（统一发送一个not found页面？）
//网站主页
router.get('/', function(req, res, next) {
  res.locals.page_title = '微博主页';
  Post.get()
    .then(function(docs) {
      res.render('index.ejs', {items: docs});
    })
    .catch(function(err) {
      //正式上线时，需另做设置
      res.status(500).send('Server internal error: '+err.message);      
    });
});

//用户主页
router.get('/user/:username', function(req, res, next) {
  res.locals.page_title = '用户页面';
  if (!has_logged_in) {
    res.set('refresh', '2, http://localhost:8080');
    res.send('<h3>请先登录您的账号</h3>');
    return;
  }
  
  Post.get(req.params.username)
    .then(function(docs) {
      //对docs做验证
      res.locals.page_title = `${req.params.username}的主页`;
      res.locals.custom_css = 'user.css';
      res.render('user.ejs', {items: docs, username: req.params.username});
    })
    .catch(function(err) {
      //正式上线时，需另做设置
      res.status(500).send('Server internal error: '+err.message);
    });
});

router.get('/user', function(req, res) {
  res.redirect('/');
});

//发表微博
router.post('/post', function(req, res) {
  res.locals.page_title = '发表微博';
  if (!has_logged_in) {
    res.set('refresh', '2, http://localhost:8080');
    res.send('<h3>您必须首先登陆，然后才能发表微博</h3>');
    return;
  }
  var username = req.session.user.username;
  var post = req.body.post;
  var newPost = new Post(username, post);
  newPost.save()
    .then(()=>{
      res.set('refresh', `1, http://localhost:8080/user/${username}`);
      res.send('<h3>发表成功</h3>');
    })
    .catch((err)=>{
      res.status(500).send('Server internal error: '+err.message);
    });
});

//获取登录页面
router.get('/login', function(req, res) {
  res.locals.page_title = '登录';
  if (has_logged_in) {
    res.set('refresh', '2, http://localhost:8080/');
    res.send('<h3>您已登录</h3>');
    return;
  }
  res.locals.custom_css = 'login.css';
  res.render('login.ejs');
});

//接收并处理登录数据
router.post('/login', function(req, res) {
  res.locals.page_title = '登录'; 
  res.locals.error = '';
  if (has_logged_in) {
    res.set('refresh', '2, http://localhost:8080/');
    res.send('<h3>您已登录_登录数据处理页</h3>');
    return;
  }

  User.get(req.body.username) //
    .then(function(docs) {
      res.locals.custom_css = 'login.css';
      if (docs.length == 0) {
        res.locals.error = '该用户不存在';
        res.render('login.ejs');
        return;
      }
      if (typeof docs[0].password !== 'string') return; 
      if (encryptData(req.body.password) !== docs[0].password) {
        res.locals.error = '密码错误';
        res.render('login.ejs');
        return;
      }

      req.session.user = {
        username: docs[0].username,
        password: docs[0].password
      };

      res.set('refresh', '1, http://localhost:8080/user/'+docs[0].username);
      res.send('<h3>登录成功</h3>');
    })
    .catch(function(err) {
      //res.set('refresh', '3, http://localhost:8080/');
      res.status(500).send('Server internal error: '+err.message);
    });
});

//登出
router.get('/logout', function(req, res) {
  res.locals.page_title = '登出'; 
  if (!has_logged_in) {
      res.set('refresh', '2, http://localhost:8080');
      res.send('<h3>您还未登录</h3>');
      return;
  }
  req.session.user = null;
  has_logged_in = false;
  res.set('refresh', '1, http://localhost:8080');
  res.send('<h3>感谢使用，拜拜。</h3>');
});

//获取注册页面
router.get('/reg', function(req, res) {
  res.locals.page_title = '注册';
  if (has_logged_in) {
    res.set('refresh', '3, http://localhost:8080');
    res.send('<h3>请先退出当前账号，再注册新账号</h3>');
    return;
  }
  res.render('reg.ejs');
});

//发送注册数据
router.post('/reg', function(req, res) {
  res.locals.page_title = '注册';

  if (typeof req.body.username !== 'string') {
    res.status(500).send('Server internal error: '+err.message);
    return;
  }
  
  //对数据的前后空格进行处理
  var user_username = req.body.username.trim(); 
  var user_password = req.body.password.trim();
  var user_password_repeat = req.body['password-repeat'].trim();

  if ((user_username === '') || (user_password === '') || (user_password_repeat === '')) {
    res.locals.error = '用户名或密码不能为空';
    res.render('reg.ejs');
    return;
  }

  if (user_password !== user_password_repeat) {
    res.locals.error = '两次输入的密码必须相同';
    res.render('reg.ejs');
    return;
  }

  //验证密码长度和所输入的字符
  if (user_password.length>5 && user_password.length<16) {
    for (let i=0; i<user_password.length; i++) {
      let char_code = user_password.charCodeAt(i);
      if ((char_code>126) || (char_code<32) || (char_code===32) || (char_code===60) || (char_code===62)) {
        res.locals.error = '密码不得包含空格，且只能包含英文字母、数字，或\'<\'和\'>\'以外的符号';
        res.render('reg.ejs');
        return;
      }
    }
  } else {
    res.locals.error = '密码长度必须在6到15个字符之间';
    res.render('reg.ejs');
    return;
  }

  if (user_username.length>=2 && user_username.length<=15) { //限制用户名在15个字以内
    for (let i=0; i<user_username.length; i++) {
      let char_code = user_password.charCodeAt(i);
      if ((char_code===32) || (char_code===60) || (char_code===62)) {//用户名不得包含空格以及>和<
        res.locals.error = '用户名不得包含空格以及\'>\'和\'<\'';
        res.render('reg.ejs');
        return; 
      }
    }
  } else {
    res.locals.error = '用户名必须在2到15个中英文字符之间';
    res.render('reg.ejs');
    return;
  }
  
  User.get(user_username)
    .then(function(docs) {
      if (docs.length>0) {
        if (user_username === docs[0].username) { //用户名已被注册
          res.locals.error = '该用户名已被注册！';
          res.render('reg.ejs');
          return;
        }
      }
    })
    .catch(function(err) {
      res.status(500).send('Server internal error: '+err.message);
      return;
    });

  var user_password_crypted = encryptData(user_password);//对密码加密
  var user = {
    username: user_username,
    password: user_password_crypted
  };
  var newUser = new User(user);
  newUser.save()
    .then(function() {
      req.session.user = newUser;
      res.set('refresh', '2, http://localhost:8080/user/'+`${user_username}`);
      res.send('<h3>注册成功！</h3>');
      return;
    })
    .catch(function(err) {
      res.set('refresh', '3, http://localhost:8080/');
      res.status(500).send('Server internal error: '+err.message);
      return;
    });
});

module.exports = router;
