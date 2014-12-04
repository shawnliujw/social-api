var logger = require("node-config-logger").getLogger("lib/ScrapeQueue.js");
var Promise = require("bluebird");
var config = require("config");
var async = require("async");
var delay = require("./../util/delayPromise");
var _ = require("lodash");
var ScrapeQueue = function (phantomInstance, options) {
    this.phantom = phantomInstance;
    this.jobs = [];
    this.processing = false;
    this.options = options || {
        maxRetries: 3
    };
    this.id = this.options.id || phantomInstance.id || '?';
    this.jobsProcessed = 0;
};

ScrapeQueue.prototype.size = function () {
    return this.jobs.length;
};

ScrapeQueue.prototype.push = function (page, batch) {
    logger.error(page);
    if (this.options.maxSize && this.jobs.length >= this.options.maxSize) {
        logger.warn('Job queue ' + this.id + ' is full : ' + this.jobs.length);
        return false;
    }
    var q = this;
    this.jobsProcessed++;
    this.jobs.push(page);
    logger.info('New job added to job queue ' + this.id + '.  total=' + this.jobs.length);

    if (!this.processing) {
        this.processing = true;
        logger.info('Resuming job queue ' + this.id + ' processing');

        async.until(
            function () {
                return q.jobs.length == 0;
            },
            function (callback) {
                var job = q.jobs.shift();
                job.attempt = job.attempt || 1;
                var phantomAccounts = this.phantom.accounts;
                var m = job.site + "@" + job.email;
                if (!_.contains(phantomAccounts, m)) {
                    this.phantom.accounts.push(m);
                }
                logger.info('job queue ' + q.id + ' - processing ' + job.url + ' for request ' + batch.id);
                //TODO
                q.phantom.request("/process", job).then(function (data) {
                    if (data.hasOwnProperty('status')) {
                        logger.info('job queue ' + q.id + ' - ' + job.url + " handled successfully - batch " + batch.id);

                        batch.appendResults(data);
                        // callback();
                        delay(500).then(function () {
                            callback();
                        });
                    } else {
                        logger.warn("no results in response: ", data, " to job ", job);
                        delay(500).then(function () {
                            callback();
                        });
                        //callback();
                    }
                });
            }
            ,
            function () {
                // check if should shutdown
                if (q.jobsProcessed > config.maxWorkerJobs) {
                    logger.warn("Job queue " + q.id + " has handled the max worker jobs " + config.maxWorkerJobs + " , need restart it.");
                    q.shuttingDown = true;
                }
                _shutdown(q);
                q.processing = false;
                logger.info('Job queue ' + q.id + ' is now empty');
            }
        )
        ;
    }
    return true;
}

function _shutdown(q) {
    if (q.shuttingDown) {
        q.phantom.stop();
        q.shuttingDown = false;
    }
}

ScrapeQueue.prototype.filter = function (filter) {
    // todo use splice instead of filter
    this.jobs = this.jobs.filter(filter);
    if (!this.jobs.length) {
        this.processing = false;
        _shutdown(this);
    }
};
ScrapeQueue.prototype.shutdown = function () {
    // worker needs to shutdown.  do it when queue is empty.
    this.shuttingDown = true;
    if (!this.processing) {
        _shutdown(this);
    }

};

module.exports = ScrapeQueue;