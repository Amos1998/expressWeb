var connPool = require("./ConnPool");
var async = require('async');

module.exports={
    ask:function(req,res){
        loginbean = req.session.loginbean;
        pool = connPool();
        //从pool中获取连接(异步,取到后回调)
        pool.getConnection(function(err,conn){
            var userAddSql = 'insert into question (typeid,typename,title,content,uid,nicheng,createtime) values(?,?,?,?,?,?,current_timestamp)';
            var param = [req.body['typeid'],req.body['typename'],req.body['title'],req.body['content'],loginbean.id,loginbean.nicheng];
            conn.query(userAddSql,param,function(err,rs){
                if(err){
                    //console.log('insert err:',err.message);
                    res.send("数据库错误,错误原因:"+err.message);
                    return;
                }
                res.send('<script>alert("提问成功");location.href="/"</script>');
            })
            conn.release();
        });
    },
    queList:function(req,res,loginbean){
        pool = connPool();
        //从pool中获取连接(异步,取到后回调)
        pool.getConnection(function(err,conn)
        {
            if(err)
            {
                //console.log('insert err:',err.message);
                res.send("获取连接错误,错误原因:"+err.message);
                return;
            }
            var page = 1;//页码
            // console.log(req.query['page'])
            if(req.query['page']!=undefined){
                page = parseInt(req.query['page']);
                if(page<1){
                    page=1;
                }
            }
            var pageSize = 2;//每页的列表数
            var pointStart = (page-1)*pageSize;//每页的起始列表
            var count=0;
            var countPage=0;//页码数

            var countSql = 'select count(*) as count from question';
            var listSql = 'select qid,title,looknum,renum,finished,updtime,createtime from question order by qid desc limit ?,?';
            var param = [pointStart,pageSize];


            async.series({
                one: function(callback) {
                    conn.query(countSql,[],function(err,rs){
                        // console.log(rs);
                        count=rs[0]["count"];
                        countPage = Math.ceil(count/pageSize);
                        if(page>countPage){
                            page=countPage;
                            pointStart = (page-1)*pageSize;
                            param = [pointStart,pageSize];
                        }
                        callback(null, rs);
                    })
                },
                two: function(callback) {
                    conn.query(listSql,param,function(err,rs){
                        callback(null, rs);
                    })
                },
            }, function(error, results) {
                //console.log(results);

                rs=results['two'];
                res.render('index', {loginbean:loginbean,page:page,rs:rs,count:count,countPage:countPage});
                //res.send('查完');
            });
            conn.release();
        });
    },
    queDetail:function(req,res){
        qid = req.query['qid'];
        if(qid!=undefined){
            sqlupd = 'update question set looknum=looknum+1 where qid=?';
            sqldetail = 'select qid,title,content,uid,nicheng,looknum,renum,finished,updtime,createtime from question where qid=?';
                param=[qid];
            pool = connPool();
            //从pool中获取连接(异步,取到后回调)
            pool.getConnection(function(err,conn)
            {
                if(err)
                {
                    //console.log('insert err:',err.message);
                    res.send("获取连接错误,错误原因:"+err.message);
                    return;
                }
                async.series({
                    one: function(callback){
                        conn.query(sqlupd,param,function(err,rs){
                            callback(null, rs);
                        })
                    },
                    two: function(callback){
                        conn.query(sqldetail,param,function(err,rs){
                            callback(null, rs);
                        })
                    }
                },function(err, results) {
                    // console.log(results);
                    loginbean = req.session.loginbean;
                    rs=results['two'];
                    res.render('queDetail', {loginbean:loginbean,rs:rs});
                    //res.send('查完');
                });

                conn.release();
            });
        }else{
            res.send('没传入qid');
        }
    },
    reply:function(req,res){
        loginbean = req.session.loginbean;
        pool = connPool();
        sql1 = 'insert into replies (qid,content,uid,nicheng) value(?,?,?,?)';
        param1=[req.body['qid'],req.body['content'],loginbean.id,loginbean.nicheng];
        sql2='update question set renum=renum+1 where qid=?';
        param2=[req.body['qid']];
        //从pool中获取连接(异步,取到后回调)
        pool.getConnection(function(err,conn){
            if (err) {
                console.log('有错');
                res.send("拿不到连接:"+err);
                return;
            }
            //事务处理
            conn.beginTransaction(function (err) {
                if (err) {
                    console.log('有错111');
                    //return callback(err, null);
                    res.send('启动事物处理出错');
                    return;
                }
                async.series([ //串行series,并行parallel
                    function(callback) {
                        conn.query(sql1,param1,function(err,rs){
                            if(err){
                                console.log('有错'+err.message);
                                callback(err,1);
                                return;
                            }
                            //console.log('执行第1条完毕');
                            callback(err,rs);//没有则callback(null,1);第2个参数是返回结果
                        });
                    },
                    function(callback) {
                        conn.query(sql2,param2,function(err,rs){
                            if(err){
                                console.log('有错'+err.message);
                                callback(err,2);
                                return;
                            }
                            //console.log('执行第1条完毕');
                            callback(err,rs);//没有则callback(null,1);第2个参数是返回结果
                        });
                    }
                ],function(err, result) {
                    //console.log(result);
                    if(err) {
                        //console.log('调用回滚1');
                        conn.rollback(function() {
                            //throw err;
                        });
                        res.send('数据库错误:'+err);
                        return;
                    }
                    // 提交事务
                    conn.commit(function(err) {
                        if (err) {
                            console.log('调用回滚2');
                            conn.rollback(function() {
                                //throw err;
                            });
                            res.send('数据库错误:'+err);
                            console.log('提交事物出错');
                        }
                        res.send('回复成功');
                        // res.send('<script>location.href="/"</script>'
                        console.log('success!');
                    });
                });
            });
            conn.release();
        });
    },
}