var logger = require("node-config-logger").getLogger("app/lib/dispatcher.js");
var Promise = require("bluebird");
var path = require("path");
var config = require("config");
var scriptFiles = require("./site-script");
var async = require("async");

var BatchRequest = require("./BatchRequest");
var PhantomInstance = require("./PhantomInstance");

var scrapeTimeout = 45000; // 45 seconds

// map fo phantom instances
var phantomInstances = [];
var nRequests = 0, nFailures = 0, nPending = 0;

exports.create = function () {
    var promises = [];
    config.ports.forEach(function (port) {
        var instance = new PhantomInstance({
            port: port,
            requestTimeout: scrapeTimeout
        });
        phantomInstances.push(instance);
        promises.push(instance.start());
    });
    return Promise.all(promises);
};


var lastPick = 0;
exports.getAvailablePhantomInstance = function () {
    for (var i = 0; i < phantomInstances.length; i++) {
        var instance = phantomInstances[lastPick++ % phantomInstances.length];
        if (instance.queue.size() < config.maxQueueSize) {
            return instance.start();
        } else {
            logger.warn("phantom worker " + instance.id + " queue is full " + instance.queue.size());
        }
    }
    return Promise.reject("All queues are full");
};

exports.applyToAllPhantomInstances = function (fn) {
    phantomInstances.forEach(function (el) {
        fn(el);
    });
};
/**
 *
 * @param site
 * @param dataArray should be array of object , each object should be one unique account
 * @param type "registration" , "edit" ,"feeds"  etc..
 * @returns {*}
 */
exports.process = function (site, dataArray, type) {
    nPending++;
    nRequests++;
    return scriptFiles.get(site)
        .then(function (scripeFile) {
            dataArray.forEach(function (element) {
                element.method = type;
                element.url = config.socialSites[site];
                element.scriptFile = scripeFile;
            });
            if (dataArray.length > 0) {
                var r = new BatchRequest(dataArray);
                return r.process(scrapeTimeout)
                    .then(function (response) {
                        logger.info("processed " + dataArray.length + " URLs with method " + type + " - status:" + response.status);
                        nPending--;
                        return response;
                    }).catch(function (err) {
                        nFailures++;
                        nPending--;
                        return {
                            status: false,
                            message: err.message || err
                        };
                    });
            } else {
                nPending--;
                nFailures++;
                return {
                    status: false,
                    message: "Nothing to do"
                };
            }
        })
        .catch(function (e) {
            nPending--;
            nFailures++;
            logger.error(e);
            return {
                "status": false,
                "message": e.message
            };
        });
}

exports.restart = function () {
    phantomInstances.forEach(function (instance) {
        instance.stop(); //will restart on demand
    });
};
