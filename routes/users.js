var express = require('express');
var router = express.Router();
var userModel = require('../models/UserModel');

/* GET users listing. */
router.all('/login', function(req, res, next) {
  subflag = req.body['subflag'];
  // console.log(subflag==undefined);
  if(subflag==undefined){
    res.render('login');
  }else{
    userModel.login(req,res);
    //res.send("执行登录");  //必须去掉
  }
});

router.post('/zhuce', function(req, res) {
  // console.log("bbbbbbbb="+req.body['nicheng']);
  userModel.zhuce(req,res);
});

module.exports = router;
