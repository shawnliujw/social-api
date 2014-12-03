var logger = require("node-config-logger").getLogger("lib/PhantomInstance.js");
var request = require("request");
var events = require("events");
var Promise = require("bluebird");
var Process = require('child_process');
var binPath = "casperjs";
var extend = require('util-extend');
var ScrapeQueue = require("./ScrapeQueue");
var path = require("path");
var config = require("config");
var delay = require("./../util/delayPromise")
var maxQueueSize = 500;

var PhantomInstance = function (options) {
    this.running = false;
    this.listening = false;
    this.emitter = new events.EventEmitter();
    this.port = options.port;
    this.id = "localhost:" + this.port;

    this.requestOptions = {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            "charset": "utf-8"
        },
        timeout: options.requestTimeout
    };
    this.queue = new ScrapeQueue(this, {
        id: this.id,
        maxSize: maxQueueSize,
        maxRetries: 3
    });
};

function _freeupPortNumber(port) {
    return new Promise(function (resolve, reject) {
        //logger.info("freeing up port " + port + " if still in use");
        logger.warn("kill port:" + port);
        var command = "kill -9 `lsof -n -iTCP:" + port + " | grep LISTEN | awk '{print $2}'`";
        Process.exec(command, function () {
            resolve();
        });
    });
}

PhantomInstance.prototype.start = function () {
    var me = this;

    if (this.listening) {
        return Promise.resolve(this);
    } else if (this.running) {
        return this.startPromise;
    }

    return _freeupPortNumber(this.port).then(function () {

        var childArgs = [
            "--ssl-protocol=any",// avoid "SSL handshake failed"
            path.join(__dirname, "./casperjs-server.js"),
            me.port
        ];

        var options = {};
        options.env = process.env;
        logger.error(childArgs);
        me.process = Process.spawn(binPath, childArgs, options);
        me.process.stderr.on('data', function (data) {
            logger.error("phantomjs worker " + me.id + " stderr:", data.toString())
        });

        me.process.on("error", function (msg) {
            logger.error("phantomjs worker " + me.id + " error:", msg);
            me.emitter.emit("error", msg);
        });

        me.process.on("exit", function (code) {
            logger.info("phantomjs worker " + me.id + " exit with code:", code);
            me.running = false;
            me.listening = false;
            me.emitter.emit("exit");
        });
        me.process.stdout.on('data', function (data) {
            data = data.toString();
            if (data && data.indexOf("Fatal") !== -1) {
                logger.error("Phantomjs stdout:", data);
            } else {
                logger.debug("Phantomjs stdout:", data);
            }
        });

        // check is phantomjs server is responding every 200ms for a max of 5000ms
        me.startPromise = _waitAvailable(me, 5000, 200);
        me.running = true;

        // start a timer to limit process life time
        if (config.maxWorkerLifetime) {
            delay(config.maxWorkerLifetime * 1000).then(function () {
                logger.warn("Phantom process(job queue) " + me.queue.id + " meet the max worker life time '" + config.maxWorkerLifetime / 60 + " minutes' , need shutdown(restart) it.");
                me.queue.shutdown();
            });
        }

        return me.startPromise;
    });
};

function _waitAvailable(instance, timeout, minWait) {
    if (timeout < 0) {
        logger.warn("phantomjs worker " + instance.id + " start timeout exceeded");
        return Promise.reject("start timeout exceeded");
    } else {
        return instance.ping()
            .then(function () {
                instance.listening = true;
                logger.info("phantomjs worker " + instance.id + " listening on port " + instance.port);
                return instance;
            })
            .catch(function (err) {
                //logger.info("ping error during startup : ", err);
                return delay(minWait).then(function () {
                    return _waitAvailable(instance, timeout - minWait, minWait * 2);
                });
            });
    }
}

PhantomInstance.prototype.restart = function () {
    var me = this;
    this.stop().then(function () {
        return me.start();
    })
};

PhantomInstance.prototype.request = function (path, data) {
    var me = this;
    var url = "http://127.0.0.1:" + this.port + path;
    var options = extend({
        url: url,
        json: data
    }, this.requestOptions);
    options.headers['Content-Length'] = options.json ? Buffer.byteLength(JSON.stringify(options.json)) : 0;
    return new Promise(function (resolve, reject) {
        request.post(options, function (err, res, data) {
            if (err) {
                if (me.listening) {
                    logger.warn("phantomjs worker " + me.id + " request error: ", err);
                    switch (err.code) {

                        case 'ESOCKETTIMEDOUT':
                        case 'ETIMEDOUT':
                            // if timeout or connection reset, process is probably hosed.
                            // attempt to restart it before the next request comes
                            me.process.kill();
                            me.listening = false;
                            me.running = false;

                            me.start().then(function () {
                                reject({
                                    message: "phantomjs timeout",
                                    retry: true
                                });
                            });
                            break;

                        default:
                            reject({
                                message: err.code
                            });

                    }
                } else {
                    reject(err);
                }
            } else {
                resolve(data);
            }
        });
    });

};

PhantomInstance.prototype.ping = function () {
    return this.request("/ping");
};

PhantomInstance.prototype.stop = function () {
    logger.info("phantomjs worker " + this.id + " stopping");
    var me = this;

    // send an exit message
    return this.request("/exit")
        .then(function () {
            me.listening = false;
        })
        .catch(function (err) {
            logger.info("phantomjs worker " + me.id + " will be killed.");
            // sending a message failed.  fallback to doing a force kill.
            me.process.kill();
            return delay(200);
        });
};


module.exports = PhantomInstance;
