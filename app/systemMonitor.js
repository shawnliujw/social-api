var logger = require("node-config-logger").getLogger("lib/systemMonitor.js");
var config = require("config");
var cronJob = require('cron').CronJob;
var os = require("os");
var dispatcher = require("./dispatcher");
var Promise = require("bluebird");
var Process = require('child_process');
var memoryCheck = function () {
    logger.info("Checking memory...");
    var totalM = os.totalmem();
    var freeM = os.freemem();
    if ((freeM / totalM) < 0.01) {
        logger.warn("Only have " + freeM / (1024 * 1024) + "M memory left, restart all casper servers");
        //dispatcher.restart();
        _restartExpress(config.listener.port);
    }
};

exports.start = function () {

    // memory check
//    new cronJob({
//        cronTime: "* */20 * * * *",
//        onTick: function () {
//            memoryCheck();
//        },
//        start: true
//    });
//
//    logger.info("Set up health check");
};

exports.stop = function () {

};
exports.stopExpress = _restartExpress;

function _restartExpress(port) {
    return new Promise(function (resolve, reject) {
        //logger.info("freeing up port " + port + " if still in use");
        logger.warn("Restart express server");
        var command = "kill -9 `lsof -n -iTCP:" + port + " | grep LISTEN | awk '{print $2}'`";
        Process.exec(command, function () {
            resolve();
        });
    });
}