var express = require('express');
var router = express.Router();
var questionModel = require('../models/questionModel')

/* GET users listing. */
router.all('/ask', function(req, res, next) {
    loginbean = req.session.loginbean;
    if(loginbean==undefined){
        res.send("<script>alert('登录过期,请重新登录');location.href='/';</script>");
        return;
    }
    subflag = req.body['subflag'];
    if(subflag==undefined){
        res.render('ask', {loginbean: loginbean});
    }else{
        //发提问
        questionModel.ask(req,res);
    }
});
router.get('/detail', function(req, res) {
    questionModel.queDetail(req,res)
});
router.post('/reply', function(req, res, next) {
    loginbean = req.session.loginbean;
    if(loginbean==undefined){
        return;
    }
    subflag = req.body['subflag'];
    if(subflag != undefined){
        questionModel.reply(req,res);
    }else{
        res.render("请用表单提交")
    }
});
module.exports = router;
