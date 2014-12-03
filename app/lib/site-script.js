var logger = require('log4js').getLogger("app/lib/site-script.js");
var path = require("path");
var Promise = require("bluebird");
var fs = require("fs");
exports.get = function (site) {
    var file = path.join(__dirname, "../sites/" + site + ".js");
    return new Promise(function (resolve, reject) {
        fs.readFile(file, function (err, data) {
            if (err) {
                logger.error(err);
                reject("There is no script for " + site);
            } else {
                resolve(file);
            }
        });
    });
}
