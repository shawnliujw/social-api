var logger = require("node-config-logger").getLogger("app/lib/systemMonitor.js");
var Promise = require("bluebird");
var Process = require('child_process');
exports.killPort = function (port) {
    return new Promise(function (resolve, reject) {
        //logger.info("freeing up port " + port + " if still in use");
        logger.warn("kill port:" + port);
        if (/^win/.test(process.platform)) {
            var command = "kill -9 `lsof -n -iTCP:" + port + " | grep LISTEN | awk '{print $2}'`";
            Process.exec(command, function () {
                resolve();
            });
        } else {
            resolve();
        }
    });
}