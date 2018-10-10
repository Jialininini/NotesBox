var express = require("express");
var router = require("./controller/router.js");
var config = require("./config.js");
var app = express();
var session = require("express-session");
var bparser = require("body-parser");
app.listen(4000);

//设置所有请求都经过session
app.use(session({
    secret:"keyboard cat",
    resave:false,
    saveUninitialized: true
}));
app.use(router.isLogin);
app.use(bparser.urlencoded({extended:true}))
app.set("view engine","ejs");
app.use(express.static("./public"))
app.use(express.static("./profile"))
app.use(express.static("./upload"))

app.get("/",router.index);
app.get("/submit",router.submit)
app.get("/del",router.del);
app.get("/update",router.update)
app.get("/doUpdate",router.doUpdate);

app.post("/login",router.login);
app.get("/register",router.register);

app.post("/register",router.signUp);
app.get("/logOut",router.logOut);

app.get("/upload",router.upload);

app.post("/upload",router.doUpload);

app.get("/cut",router.cut);