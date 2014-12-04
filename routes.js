var Promise = require("bluebird");
var logger = require("node-config-logger").getLogger("app/controller.js");
var controller = require("./app/controller");
module.exports = function (app) {
    app.post("/api/social/:site/registration", controller.registration);
    app.post("/api/social/:site/operation", controller.operate);
    //app.put("/api/social/account/:site", controller.edit);
    app.post("/api/proxy", controller.updateProxy);
};

//twitter test account
//sdfsdf@t1.com
//qweasd123

//
