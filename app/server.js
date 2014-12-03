var logger = require("node-config-logger").getLogger("app/lib/server.js");
var Promise = require("bluebird");
var childProcess = require('child_process');
var path = require("path");
var binPath = /^win/.test(process.platform) ? "casperjs.bat" : "casperjs";
var retailerScripts = require("./retailer"), fs = require("fs");
var config = require("config");
var async = require("async");
var util = require('util');
var monitor = require("./monitor");
var db = require('mongo-bluebird').create(config.scrapecache.db);

var ScrapeQueue = require("./ScrapeQueue");
var BatchRequest = require("./BatchRequest");

var scrapeTimeout = 120000; // 2 minutes;

var cache = {
	details: db.collection("details"),
	links: db.collection("links")
};

var queues = {};

var createChildServer = function(port) {

	return monitor.killPort(port)
			.then(function() {
				var childArgs = [
					"--ssl-protocol=any",// avoid "SSL handshake failed"
					path.join(__dirname, "./casperjs-server.js"),
					JSON.stringify({"port": port})
				];

				var options = {};
				options.env = process.env;
				if (config.casper && config.casper.logLevel) {
					util._extend(options.env, {'CASPER_LOG_LEVEL': config.casper.logLevel});
					util._extend(options.env, {'CASPER_LOG_FILE': config.casper.logFile});
					//childArgs.unshift("--log-level=" + config.casper.logLevel);
				}

				logger.info("Create casperjs server on port:" + port);
				var ps = childProcess.spawn(binPath, childArgs, options);
				ps.stdout.on('data', function(data) {
					data = data.toString();
					if (data && data.indexOf("Fatal") !== -1) {
						logger.error("Phantomjs stdout:", data);
					} else {
						logger.debug("Phantomjs stdout:", data);
					}
				});

				ps.stderr.on('data', function(data) {
					logger.error("Phantomjs stderr:", data.toString())
				});

				ps.on("error", function(msg) {
					logger.error("Phantomjs prcess error:",msg);
				});

//				ps.on('close', function(code) {
//					console.log("Phantomjs process close with code:", code);
//					createChildServer(port);
//				});
				ps.on("exit",function(msg){
					console.log("Phantomjs process exit with code:", msg);
					createChildServer(port);
				})
//				
//				phantomProcess.on("exit", function(msg) {
//					logger.info("phantomjs exit",msg);
//					createChildServer(port);
//				});
				return port;
			});

};

exports.create = createChildServer;


function _scrape(urls, type, locale, retailer, port) {
	var url = "http://localhost:" + port + "/scrape";
	var q = queues[url];
	if (!q) {
		q = new ScrapeQueue(url, scrapeTimeout);
		queues[url] = q;
	}

	try {
		return _getScripts(urls, locale, retailer).then(function(newUrls) {
			newUrls.forEach(function(element) {
				element.method = type;
			});
			logger.info("processing " + newUrls.length + " URLs with method " + type);
			if (newUrls.length > 0) {
				var r = new BatchRequest(newUrls);
				return r.process(q);
			} else {
				return Promise.resolve({
					status: false,
					"message": "Nothing to do"
				});
			}
		});
	} catch (e) {
		logger.error(e);
		return Promise.resolve({
			"status": false,
			"message": e.message
		});
	}
}

exports.scrape = function(urls, locale, retailer, type, expiration, port) {
	if (!Array.isArray(urls)) {
		urls = [urls];
	}
	expiration = (typeof expiration !== 'number') ? config.scrapecache.validity : expiration;
	return new Promise(function (resolve, reject) {
		var now = new Date();
		now.setHours(now.getHours() - expiration); // subtract expiration to current time to calculate validity
		// Drop outdated cache
		return cache[type].remove({url: {$in: urls}, time: {$lt: now}})
			.then(function () {
				if (!urls.length) {
					resolve({status: true, message: '', results: []});
				} else {
					return _scrape(urls, type, locale, retailer, port).then(function (result) {
						resolve(result);
					});
				}
			});
	});
};

exports.clearCache = function(type, urls, locale, retailer) {
	return _getScripts(urls, locale, retailer)
			.then(function(scripts) {
				var files = scripts.map(function(script) {
					return script.retailerFile.split('/').slice(-1).join('/');
				});
				return cache[type].remove({script: {$in: files}, url: {$in: urls}});
			});
};

exports.retailersList = function(locale) {
	return new Promise(function(resolve, reject) {
		var dir = __dirname + '/sites/' + locale + '/';
		var scripts = [];
		fs.readdir(dir, function(err, files) {
			if (err) {
				return reject(err);
			}
			async.each(files, function(file, callback) {
				fs.stat(dir + file, function(err, stats) {
					scripts.push(file);
					callback();
				});
			}, function(err) {
				if (err) {
					return reject(err);
				}
				resolve(scripts);
			});
		});
	});
};

function _getScripts(urls, locale, retailer) {
	return retailerScripts.get(urls, locale, retailer).then(function(data) {
		var array = [];
		data.forEach(function(element) {
			if (element.status) {
				array.push({
					"url": element.url,
					"retailerFile": element.retailerFile
				});
			} else {
				logger.warn("Dropping scrape of " + element.url);
			}
		});
		return array;
	});
}
