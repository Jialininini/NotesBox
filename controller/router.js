//路由文件
var config = require("../config.js");
var message = config.collectionName; //保存留言信息的集合
var sd = require("silly-datetime");
var db = require("../model/node_modules/myModule")
var objectId = require('mongodb').ObjectID;
var md5 = require("../model/md5.js")
var user = config.user;
var fs = require("fs");
var fd = require("formidable");
var gm = require("gm");

//判断是否登录,如果登录了,请求放行index;未登录,拦截请求,跳转登录页面
exports.isLogin = function(req,res,next){
    var username = req.session.username;
    //放行请求的条件: 1. username有值,登陆过
                   //2. 登录的请求 3. 注册的请求
    console.log(req.url)
    if(req.url == "/login" || req.url =="/register"){
        next();
        return;
    };
    if(!username){
        res.render("login");
        //res.send("Please log in first")
        return;
    }else{//登录了,检查数据库中数据
        //next();//没写return就写else{next()} 登陆了,请求放行,由后续路由继续处理该请求
        //查询数据库是否含有username的用户信息,避免空数据库
        db.findAll(user,function(err,docs){
            var flag = false;//开关,假设数据库中有该数据
            for(var i = 0; i < docs.length; i++){
                if(docs[i].username == username){//查到了数据,session也保存了该数据,说明已登录.
                    flag = true;
                    next();
                    return;//必须要return噢,特别是当此
                }
            }
     if(!flag){
                //当flag为false.说明开关没有变化,即没有数据
                //跳转到登录页面
                res.render("login");
            }
        })
    }
}

//  '/'请求
exports.index = function(req,res){
    //判断是否已经登录,如果登录了,跳转到留言的页面,如果没有登录,跳转到登录页面
    if(req.session.username){
         var username = req.session.username;//获取session中保存的username
    }
    /*如果存在,说明以前登录过且保存过值
    if(!username) {//如果没登陆过,跳转至登录页面
        res.render("login");
        return;
    }*/
    //res.render("index")
        db.findAll(message,function(err,docs){
            if(err){
                console.log(err);
                res.render("error",{errMsg:"哎呀呀,貌似有点故障呢,等会儿再试试啰~"});
            }else{
                db.findAll(user,function(err,users){
                    if (err) {
                        console.log(err);
                        res.render("error",{errMsg:"哎呀呀,貌似有点故障呢,等会儿再试试啰~"});
                    }else{
                        //传递数据:所有的留言,session中保存的用户名,所有的用户信息
                        res.render("index",{msg:docs,username:username,users:users});
                    }
                })
            }
        })
}


//提交留言
exports.submit = function(req,res){
    var query = req.query;
    console.log(query)
    var time = sd.format(new Date(),"YYYY-M-D HH:mm:ss");
    query.time = time;
    query.username = req.session.username;
    console.log(query);
    db.add(message,query,function(err,result){
        if(err){//出错了:跳转至错误页面,显示错误的情况
            console.log(err);
            res.render("error",{errMsg:"哎呀呀,貌似有点故障呢,等会儿再试试啰~"});
        }else{
            //留言成功,跳转
            res.redirect("/")
        }
    })
}

//删除留言
exports.del = function(req,res){
    var id = req.query.id;
    id = objectId(id);
    db.del(message,{_id:id},function(err,docs){
        if(err){//出错了:跳转至错误页面,显示错误的情况
            console.log(err);
            res.render("error",{errMsg:"哎呀呀,删除出错了呢,等会儿再试试啰~"});
        }else{
            //留言成功,跳转
            res.redirect("/");
        }
    })
}


//点击修改留言
exports.update = function(req,res){
    var id = req.query.id;
    id = objectId(id);
    db.find(message,{_id:id},function(err,docs){
        if(err){//出错了:跳转至错误页面,显示错误的情况
            console.log(err);
            res.render("error",{errMsg:"哎呀呀,修改出错了呢,等会儿再试试啰~"});
        }else{
            //留言成功,跳转
            res.render("update",{data:docs[0]})
        }
    })
}

//提交修改留言
exports.doUpdate = function(req,res){
    var id = req.query.id;
    var notes = req.query.notes;
    id = objectId(id);
    var time = sd.format(new Date(),"YYYY-M-D HH:mm:ss");
    db.modify(message,{_id:id},{notes:notes,time:time},function(err,result){
        if(err){//出错了:跳转至错误页面,显示错误的情况
            console.log(err);
            res.render("error",{errMsg:"哎呀呀,修改失败,等会儿再试试啰~"});
        }else{
            //留言成功,跳转
            res.redirect('/');
        }
    })
}


//登录
exports.login = function(req,res){
    console.log(req.body)
     /*res.end() 测试*/
    var query = req.body;
    query.password = md5.md5(query.password);
    console.log(query)
    //判断用户名密码是否正确
    db.find(user,query,function(err,docs){
        console.log(docs)
        if(err){
            res.render("error",{errMsg:"Network error, click <a>here go back</a>"})
        }else{
            if(docs.length >0){//数组中有数据,说明查到了数据,用户名正确
                //跳转到首页之前,先保存session登录状态
                req.session.username = query.username;
                res.redirect('/');
            }
        }
    })
}


//注册
exports.register= function(req,res){
    res.render("register");
}

exports.signUp = function(req,res){
    var query = req.body;
    console.log(query);
    query.password = md5.md5(query.password);
    query.pic = "/img/1.jpg";//新注册用户的默认头像
    db.add(user,query,function(err,docs){
        if(err){
            console.log(err);
            res.render("error",{errMsg:"Sign up error,please <a href='/register'>try again</a>"})
        }else{
            console.log(docs);
            //注册成功,自动登录跳转到首页
            req.session.username = query.username;
            res.redirect("/");
        }
    })
}


//退出登录
exports.logOut = function(req,res){
    //res.clearCookie("connect.sid");
    //express-session模块提供的删除session的方法
    req.session.destroy(function(err){
        res.redirect("/");
    })
}

//点击上传头像
exports.upload = function(req,res){//跳转到上传头像的页面
    res.render("upload");
}

//实现上传头像
exports.doUpload = function(req,res){
    var form = fd.IncomingForm();
    form.uploadDir = "./upload";
    //解析请求,获取图片
    form.parse(req,function(err,fields,files){
            if(err){
                console.log(err);
                res.render("error",{errMsg:"Oops! There might be some mistakes occurred, please try again later."})
            }else{
                var oldPath = files.file.path;//获取旧路径
                var oldName = files.file.name; //获取原来的名称
                var arr = oldName.split(".");//拆分
                var ext = arr[arr.length-1];//获取后缀名
                var newName = sd.format(new Date(), "YYYYMMDDHHmmss")+"."+ext;
                fs.rename(oldPath,"./upload/"+newName,function(err){
                    if(err){
                        console.log(err);
                        res.render("error",{errMsg:"Oops! There might be some mistakes occurred, please try again later."});
                        return;
                    }
                    //重命名成功,跳转剪切页面
                    res.render("cut",{pic:newName});
                })
            }

    })
}


//剪切上传图片
exports.cut = function(req,res){
    //console.log(req.query);
    //res.end();
    //获取参数
    var x = parseInt(req.query.x);
    var y = parseInt(req.query.y);
    var h = parseInt(req.query.h);
    var w = parseInt(req.query.w);
    var img = req.query.img;
    gm("./upload/"+img).crop(w,h,x,y).write("./profile/"+img,function(err){
        if(err){
            console.log(err);
            res.render("error",{errMsg:"Oops! There might be some mistakes occurred, please try again later."});
            return;
        }else{
            var username = req.session.username;
            db.modify(user,{username:username},{pic:img},function(err,result){
                if(err){
                    console.log(err);
                    res.render("error",{errMsg:"Oops! There might be some mistakes occurred, please try again later."})
                }else{
                    res.redirect("/");
                }
            })
        }
    })
}