var logger = require("node-config-logger").getLogger("lib/BatchRequest.js");
var Promise = require("bluebird");
var dispatcher = require("./dispatcher");
var delay = require("./../util/delayPromise")
var timeout = require("config").casper.timeout;
var _requestId = 1;

function BatchRequest(pages) {
    this.id = "br." + _requestId++;
    this.pages = pages;

    // tack on a request id to each scraped page for check-pointing
    this.pages.forEach(function (el) {
        el._bid = this.id;
    }.bind(this));

    this.response = {
        status: true,
        results: []
    };
}

BatchRequest.prototype.process = function () {
    if (!this.promise) {
        logger.info("batch request " + this.id + " processing");
        var br = this;
        if (!timeout) {
            timeout = 45000;
        }
        // batch time out in case a request gets lost
        if (timeout) {
            this.timeout = setTimeout(function () {
                if (br.promise && br.promise.isPending()) {
                    logger.error("batch request " + br.id + " timed out");
                    br.abort("batch timeout exceeded");
                }
            }, timeout * this.pages.length);
        }

        this.promise = new Promise(function (resolve, reject) {
            br.resolve = resolve;
            br.reject = reject;
        });

        // start processing
        // processing is delayed so that the promise can be returned and used by
        // the caller before any resolution of it occurs.
        delay(10).then(function () {
            br.processing = true;
            br.pages.forEach(function (el) {
                if (br.processing) {
                    dispatcher.getAvailablePhantomInstance().then(function (phantom) {
                        if (br.processing) {
                            phantom.queue.push(el, br);
                        }
                    }).catch(function (err) {
                        // cannot get a phantom instance.  fail the whole request
                        br.processing = false;
                        br.response.status = false;
                        br.response.message = "phantom driver instance at capacity";
                        logger.warn("phantom driver instance at capacity");
                        _resolve(br);
                    });
                }
            });
        });
    }

    return this.promise;
};

function _resolve(br) {
    logger.info("batch request " + br.id + " resolved with status " + br.response.status);
    br.processing = false;

    if (br.timeout) {
        clearTimeout(br.timeout);
    }

    // remove me from the _requests.array;
    br.resolve(br.response);

    // remove any outstanding job for this request.
    dispatcher.applyToAllPhantomInstances(function (phantom) {
        phantom.queue.filter(function (el) {
            return el._bid !== br.id;
        });
    });
}

function _ensurePending(br) {
    if (!br.promise) {
        logger.error("batch request " + br.id + " was never started (programming error)");
        return false;
    } else if (!br.promise.isPending()) {
        logger.error("batch request " + br.id + " was already processed (programming error)");
        return false;
    } else {
        return true;
    }
}

BatchRequest.prototype.appendResults = function (data) {
    if (_ensurePending(this)) {
        if (!Array.isArray(data)) {
            data = [data];
        }

        this.response.results = this.response.results.concat(data);

        if (this.response.results.length >= this.pages.length) {
            this.response.status = true;
            _resolve(this);
        } else {
            logger.info("batch request " + this.id + " got " + this.response.results.length + " out of " + this.pages.length + " results expected");
        }
    }
};

BatchRequest.prototype.abort = function (err) {
    logger.error("Aborting batch request " + this.id, err);
    if (_ensurePending(this)) {
        this.response.status = false;
        this.response.message = err;

        _resolve(this);
    }
};


module.exports = BatchRequest;