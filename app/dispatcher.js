
var logger = require("node-config-logger").getLogger("lib/dispatcher.js");
var Promise = require("bluebird");
var path = require("path");
var config = require("config");
var retailerScripts = require("./retailer");
var async = require("async");

var BatchRequest = require("./BatchRequest");
var PhantomInstance = require("./PhantomInstance");

var scrapeTimeout = 45000; // 45 seconds

// map fo phantom instances
var phantomInstances = [];
var nRequests = 0, nFailures = 0, nPending = 0;

exports.create = function() {
	var promises = [];
	config.ports.forEach(function(port) {
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
exports.getAvailablePhantomInstance = function() {
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

exports.applyToAllPhantomInstances = function(fn) {
	phantomInstances.forEach(function(el) {
		fn(el);
	});
};

exports.scrape = function(urls, locale, retailer, type, expiration) {
	if (!Array.isArray(urls)) {
		urls = [urls];
	}
	if (!urls.length) {
		return Promise.resolve({status: true, message: '', results: []});
	} else {
		nPending ++;
		nRequests ++;
		return retailerScripts.get(urls, locale, retailer)
			.then(function (newUrls) {
				newUrls.forEach(function (element) {
					element.method = type;
				});
				if (newUrls.length > 0) {
					var r = new BatchRequest(newUrls, {
						cacheValidity: (expiration || expiration === 0) ? expiration : config.scrapecache.validity
					});
					return r.process(scrapeTimeout).then(function (response) {
						logger.info("processed " + newUrls.length + " URLs with method " + type + " - status:" + response.status);
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
};

exports.restart = function() {
	phantomInstances.forEach(function(instance) {
		instance.stop(); //will restart on demand
	});
};

exports.getStatus = function() {
	return {
		instances: phantomInstances.reduce(function(arr, el) {
			arr.push({
				id: el.id,
				queueSize: el.queue.size(),
				running: el.running,
				listening: el.listening
			});
			return arr;
		}, []),
		requests: {
			lifetime: nRequests,
			failures: nFailures,
			pending: nPending
		}
	};
};