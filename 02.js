var express=require("express");
var app=express();
session = require('express-session');
var formidable=require("formidable");
var db=require("./model/db");
var path=require("path");
var fs = require("fs");
var md5=require("./model/md5");
var sd = require("silly-datetime");

//使用session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.set("view engine","ejs");

app.use(express.static("./public"));
app.use("/avatar",express.static("./avatar"));

//显示首页
app.get("/",function (req,res,next) {
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "未登录";  //制定一个空用户名
        var login = false;
    }
    res.render("index",{
        "login":login,
        "username":username,
        "active": "首页"
    });
})

//注册页面
app.get("/regist",function(req,res,next){
    res.render("regist",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active": "注册"
    });
});

//登陆页面
app.get("/login",function(req,res,next){
    res.render("login",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active": "登录"
    });
});

//执行注册
app.get("/doregist",function(req,res,next){
    var dengluming = req.query.dengluming;
    var mima = req.query.mima;
    //加密
    mima = md5(md5(mima).substr(4,7) + md5(mima));

    db.find("users", {"dengluming": dengluming}, function (err, result) {
        if (err) {
            res.send("-3"); //服务器错误
            return;
        }
        if (result.length != 0) {
            res.send("-1"); //被占用
            return;
        }
        //没有相同的人，就可以执行接下来的代码了：

        //现在可以证明，用户名没有被占用
        //把用户名和密码存入数据库
        db.insertOne("users",{
            "dengluming" : dengluming,
            "mima" : mima
        },function(err,result){
            if(err){
                res.send("-1");
                return;
            }
            req.session.login = "1";
            req.session.username = dengluming;

            res.send("1"); //注册成功，写入session
        })
    });
});

app.post("/dologin",function(req,res,next){
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        var dengluming = fields.dengluming;
        var mima = fields.mima;
        mima = md5(md5(mima).substr(4,7) + md5(mima));

        //检索数据库，按登录名检索数据库，查看密码是否匹配
        db.find("users",{"dengluming":dengluming},function(err,result){
            if(result.length == 0){
                res.send("-2");  //-2没有这个人
                return;
            }
            var shujukuzhongdemima = result[0].mima;
            //要对用户这次输入的密码，进行相同的加密操作。然后与
            //数据库中的密码进行比对
            if(mima == shujukuzhongdemima){
                req.session.login = "1";
                req.session.username = dengluming;
                res.send("1");  //成功
            }else{
                res.send("-1"); //密码不匹配
            }
        });
    });
    return;
});

//404页面
app.get("/404",function (req,res,next) {
    res.render("404",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active": "404"
    });
})

app.get("/message",function (req,res,next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("message",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : ""
    });
})

app.get("/search",function (req,res,next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("search",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : ""
    });
})

app.get("/table",function (req,res,next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("table",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : ""
    });
})

app.get("/taskArea",function (req,res,next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("taskArea",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : ""
    });
})

app.get("/userInfo",function (req,res,next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("user-info",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : ""
    });
});

//更改资料
app.get("/updata",function(req,res,next){
    var dengluming=req.query.dengluming
    var teacherId = req.query.teacherId;
    var collegeName = req.query.collegeName;
    var telNum = req.query.telNum;
    var sex = req.query.sex;
    var lesson = req.query.lesson;

    db.find("post",{"dengluming":dengluming},function (err,result) {
        if (result.length != 0) {
            //用户填写过一次，更改它的值
            db.updateMany("post",{"dengluming":dengluming}, {
                $set: {
                    "teacherId" : teacherId,
                    "collegeName":collegeName,
                    "telNum":telNum,
                    "sex":sex,
                    "lesson":lesson}
            }, function (err, results) {
                res.send("1");//修改成功

            });
            return;
        };
        db.insertOne("post",{
            "dengluming": dengluming,
            "teacherId" : teacherId,
            "collegeName":collegeName,
            "telNum":telNum,
            "sex":sex,
            "lesson":lesson
        },function(err,result){
            if(err){
                res.send("-1");
                return;
            }
            res.send("1"); //更改成功
        })
    });
});

//显示修改资料
app.get("/showuserinfo",function (req,res,next) {
    var dengluming=req.query.dengluming;
    db.find("post",{"dengluming":dengluming},function (err,result) {
        console.log(result);
        if(err || result.length == 0){
            res.json("");
            return;
        }
        res.json(result);
    })
});

//显示课程
app.get("/showLesson",function (req,res,next) {
    var dengluming=req.session.username
    db.find("lesson",{"dengluming":dengluming},function (err,result) {
        // console.log(result);
        if(err || result.length == 0){
            res.json("");
            return;
        }
        res.json(result);
    })
});

//增加课程
app.get("/updataLesson",function(req,res,next){
    var dengluming=req.query.dengluming
    var lessonTitle = req.query.lessonTitle;
    var lessonDetail = req.query.lessonDetail;
    var lessonLevel = req.query.lessonLevel;
    var lessonPopulation = req.query.lessonPopulation;
    var lessonPath = req.query.lessonPath;
    var lessonImg=req.query.lessonImg==null?"img/lesson/react.jpg":req.query.lessonImg
    db.find("lesson",{"dengluming":dengluming},function (err,result) {
        db.insertOne("lesson",{
            "dengluming": dengluming,
            "lessonImg":lessonImg,
            "lessonTitle" : lessonTitle,
            "lessonDetail":lessonDetail,
            "lessonLevel":lessonLevel,
            "lessonPopulation":lessonPopulation,
            "lessonPath":lessonPath
        },function(err,result){
            if(err){
                res.send("-1");
                return;
            }
            res.send("1"); //更改成功
        })
    });
});

//增加消息
app.get("/addNotion",function(req,res,next){
    var notionContent=req.query.notionContent;
    db.insertOne("information",{
            "dengluming":"admin",
            "content": notionContent
        },function(err,result){
            if(err){
                res.send("-1");
                return;
            }
            res.send("1"); //更改成功
        })
});

//显示消息
app.get("/showInform",function (req,res,next) {
    db.find("information",{"dengluming":"admin"},function (err,result) {
        // console.log(result);
        if(err || result.length == 0){
            res.json("");
            return;
        }
        res.json(result);
    })
});

//管理员登录后的界面
app.get("/managePage",function (req,res,next) {
    //必须保证登陆
    // if (req.session.login != "1") {
    //     res.end("非法闯入，这个页面只能管理员才能访问！");
    //     return;
    // }
    res.render("ManagePage",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : ""
    });
});

//管理员登录
app.get("/managerLogin",function(req,res,next){
    res.render("managerLogin",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active": "管理员登录"
    });
});

//登录
app.post("/doManager",function(req,res,next){
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        var dengluming = fields.dengluming;
        var mima = fields.mima;

        //检索数据库，按登录名检索数据库，查看密码是否匹配
        db.find("manager",{"dengluming":dengluming},function(err,result){
            if(result.length == 0){
                res.send("-2");  //-2没有这个人
                return;
            }
            var shujukuzhongdemima = result[0].mima;
            //要对用户这次输入的密码，进行相同的加密操作。然后与
            //数据库中的密码进行比对
            if(mima == shujukuzhongdemima){
                req.session.login = "1";
                req.session.username = dengluming;
                res.send("1");  //成功
            }else{
                res.send("-1"); //密码不匹配
            }
        });
    });
    return;
});

//上传课程图片
//设置头像
// app.post("/dosetavatar", function (req, res, next) {
//     //必须保证登陆
//     // if (req.session.login != "1") {
//     //     res.end("非法闯入，这个页面要求登陆！");
//     //     return;
//     // }
//
//     var form = new formidable.IncomingForm();
//     form.uploadDir = path.normalize(__dirname + "/../public/img/lesson");
// });

//上传图片
app.post("/upImg",function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/avatar");
    form.parse(req, function (err, fields, files) {
        console.log(files);
        var ttt = sd.format(new Date(), 'YYYYMMDDHHmmss');
        var ran = parseInt(Math.random() * 89999 + 10000);
        var oldpath = files.touxiang.path;
        var newpath = path.normalize(__dirname + "/avatar") + "/" +ttt + ran+ ".jpg";
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.send("失败");
                return;
            }
            req.session.avatar = req.session.username + ".jpg";
            //跳转到切的业务
            res.redirect("/");
        });
    });
});

app.listen(3000);