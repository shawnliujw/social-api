
var logger = require("node-config-logger").getLogger("lib/ScrapeQueue.js");
var Promise = require("bluebird");
var config = require("config");
var async = require("async");
var scrapeCache = require("./scrapeCache");
var delay = require("./util/delayPromise");


var ScrapeQueue = function(phantomInstance, options) {
    var proceedJobs = 0;
    this.phantom = phantomInstance;
	this.jobs = [];
	this.processing = false;
	this.options = options || {
		maxRetries: 3
	};
	this.id = this.options.id || phantomInstance.id || '?';
	this.jobsProcessed = 0;
};

ScrapeQueue.prototype.size = function() {
	return this.jobs.length;
};

ScrapeQueue.prototype.push = function(page, batch) {
	if (this.options.maxSize && this.jobs.length >= this.options.maxSize) {
		logger.warn('Scrape queue ' + this.id + ' is full : ' + this.jobs.length);
		return false;
	}

	var q = this;
    this.proceedJobs++;
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

				scrapeCache.find(job.method, job.url, job.cacheValidity).then(function (items) {
					if (items && items.length) {
						items[0].cached = true;
						batch.appendResults(items[0]);
						callback();
					} else {
						logger.info('job queue ' + q.id + ' - scraping ' + job.url + ' for request ' + batch.id);
						q.phantom.request("/scrape", [job]).then(function (data) {
							if (data.hasOwnProperty('results') && data.results.length) {
								logger.info('job queue ' + q.id + ' - ' + job.url + " scraped successfully - batch " + batch.id);

								// add timestamp for cache invalidations
								data.results.forEach(function (el) {
									el.time = new Date();
								});
								batch.appendResults(data.results);
								scrapeCache.put(job.method, data.results)
									.finally(function () {
										callback();
										//delay(500).then(function() {callback();});
									});
							} else {
								logger.warn("no results in response: ", data, " to job ", job);
								//delay(500).then(function() {callback();});
								callback();
							}
						}).catch(function (err) {
							logger.error("Failed to process ", job, " with ", err.message);
							if (err.retry && job.attempt++ <= q.options.maxRetries) {
								q.jobs.unshift(job);
							} else {
								batch.appendResults({
									status: false,
									url: job.url,
									message: err.message
								});
							}
//							batch.abort(err);
							//delay(500).then(function() {callback();});
							callback();
						});
					}
				});

			},
			function () {
				// check if should shutdown
                if(q.proceedJobs > config.maxWorkerJobs) {
                    logger.warn("Job queue "+ q.id + " has scraped the max worker jobs " + config.maxWorkerJobs + " , need restart it.");
                    q.shuttingDown = true;
                }
				_shutdown(q);
				q.processing = false;
				logger.info('Scrape queue ' + q.id + ' is now empty');
			});
	}
	return true;
};

function _shutdown(q) {
	if (q.shuttingDown) {
		q.phantom.stop();
		q.shuttingDown = false;
	}
}

ScrapeQueue.prototype.filter = function(filter) {
	// todo use splice instead of filter
	this.jobs = this.jobs.filter(filter);
	if (!this.jobs.length) {
		this.processing = false;
		_shutdown(this);
	}
};

ScrapeQueue.prototype.shutdown = function() {
	// worker needs to shutdown.  do it when queue is empty.
	this.shuttingDown = true;
	if (!this.processing) {
		_shutdown(this);
	}

};

module.exports = ScrapeQueue;