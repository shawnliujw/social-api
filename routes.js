var Promise = require("bluebird");
var logger = require("node-config-logger").getLogger("app/controller.js");
var controller = require("./app/controller");
module.exports = function (app) {
    app.post("/api/social/:site", controller.registration);
    app.put("/api/social/:site",controller.edit);
};

