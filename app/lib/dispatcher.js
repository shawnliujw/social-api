var logger = require("node-config-logger").getLogger("app/lib/dispatcher.js");
var Promise = require("bluebird");
var path = require("path");
var config = require("config");
var scriptFiles = require("./site-script");
var async = require("async");
var _ = require("lodash");
var BatchRequest = require("./BatchRequest");
var PhantomInstance = require("./PhantomInstance");
var freeport = require("freeport");
// map fo phantom instances
var phantomInstances = [];

exports.create = function () {
    return _getProxies()
        .then(function (proxies) {
            var promises = [];
            proxies.forEach(function (proxy) {
                var instance = new PhantomInstance({
                    proxy: proxy
                });
                phantomInstances.push(instance);
                promises.push(instance.start());
            });
            return Promise.all(promises);
        })

};

function _getProxies() {
    var promises = [];
    config.proxies.forEach(function (proxy) {
        if (!proxy.port) {
            var promise = _freePort()
                .then(function (port) {
                    proxy.port = port;
                    return proxy;
                });
            promises.push(promise);
        }
    });
    return Promise.all(promises)
        .then(function (result) {
            return config.proxies;
        });
}

function _freePort() {
    return new Promise(function (resolve, reject) {
        freeport(function (err, port) {
            resolve(port);
        });
    });
}

var lastPick = 0;
exports.getAvailablePhantomInstance = function (ac) {
    return refreshProxies()
        .then(function () {
            var key = ac.site + "@" + ac.email;
            var instance = _.find(this.accounts, key);
            if (!instance || !(instance.queue.size() < config.maxQueueSize)) {
                for (var i = 0; i < phantomInstances.length; i++) {
                    instance = phantomInstances[lastPick++ % phantomInstances.length];
                    if (instance.queue.size() < config.maxQueueSize) {
                        return instance.start();
                    } else {
                        logger.warn("phantom worker " + instance.id + " queue is full " + instance.queue.size());
                    }
                }
            } else {
                return instance.start();
            }
            return Promise.reject("All queues are full");
        });
};

exports.refreshProxies = refreshProxies;

function refreshProxies() {
    return _getProxies()
        .then(function (proxies) {
            if (proxies.length !== phantomInstances.length) {
                return _killServerNotInProxies()
                    .then(_startNewServer);
            } else {
                return Promise.resolve();
            }
        });
}
function _startNewServer() {
    var proxies = config.proxies;
    var array = [];
    proxies.forEach(function (proxy) {
        if (!_.find(phantomInstances, {"proxy": proxy})) {
            var instance = new PhantomInstance({
                proxy: proxy
            });
            phantomInstances.push(instance);
            array.push(instance.start());
        }
    });
    if (array.length > 0) {
        return Promise.all(array);
    } else {
        return Promise.resolve();
    }
}

function _killServerNotInProxies() {
    var array = [];
    var proxies = config.proxies;
    phantomInstances = phantomInstances.filter(function (ph) {
        if (!_.find(proxies, ph.proxy)) {
            array.push(ph.stop());
        }
        return flag;
    });

    if (array.length > 0) {
        return Promise.all(array);
    } else {
        return Promise.resolve();
    }
}

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
    return scriptFiles.get(site)
        .then(function (scripeFile) {
            dataArray.forEach(function (element) {
                element.method = type;
                element.url = config.socialSites[site];
                element.scriptFile = scripeFile;
            });
            if (dataArray.length > 0) {
                var r = new BatchRequest(dataArray);
                return r.process()
                    .then(function (response) {
                        logger.info("processed " + dataArray.length + " URLs with method " + type + " - status:" + response.status);
                        return response;
                    }).catch(function (err) {
                        return {
                            status: false,
                            message: err.message || err
                        };
                    });
            } else {
                return {
                    status: false,
                    message: "Nothing to do"
                };
            }
        })
        .catch(function (e) {
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
