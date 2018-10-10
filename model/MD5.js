var crypto = require("crypto");
var salt = "jiali";

exports.md5 = function(pwd){
    pwd = crypto.createHash("md5").update(pwd).digest("base64");
    pwd.substring(2,6);
    pwd = pwd + salt;
    pwd = crypto.createHash("md5").update(pwd).digest("base64");
    return pwd;
}