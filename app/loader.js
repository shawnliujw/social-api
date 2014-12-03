var retailerScripts = require("./retailer");
var logger = require('log4js').getLogger("/lib/loader.js");
var fs = require("fs");
var Promise = require("bluebird");
var async = require("async");
var config = require("config");

var db = require('mongo-bluebird').create(config.scrapecache.db);
var cache = {
	details: db.collection("details"),
	links: db.collection("links")
}


function processUrls(urls, locale, retailer) {
	var promises = [];
	urls.forEach(function (url) {
		if (url && /http/.test(url)) {
			promises.push(retailerScripts.get(url, locale, retailer));
		}
	});
	return Promise.all(promises).then(function (data) {
		var array = [];
		for (var j = 0; j < data.length; j++) {
			if (data[j]) {
				array.push({
					"url": urls[j],
					"retailerFile": data[j]
				});
			}
		}
		return array;
	});
}

var _load = function (urls, type, locale, retailer, expiration) {
	if (!Array.isArray(urls)) {
		urls = [urls];
	}
	expiration = (typeof expiration !== 'number') ? config.scrapecache.validity : expiration;
	return new Promise(function (resolve, reject) {
		var cachedResults = [];
		var now = new Date();
		now.setHours(now.getHours() - expiration); // subtract expiration to current time to calculate validity
		var doLoad = function () {
			try {

				processUrls(urls, locale, retailer).then(function (newUrls) {
					logger.info("processing " + newUrls.length + " URLs with method " + type);
					if (newUrls.length > 0) {
						var loaderServer = require("./server");
						loaderServer.load(newUrls, type).then(function (result) {
							if (result && result.status && result.results) {
								for (var i in result.results) {
									result.results[i].time = new Date();
								}
								cache[type].insert(result.results).then(function () {
									var allResults = cachedResults.concat(result.results);
									result.results = allResults;
									resolve(result);
								});
							} else {
								resolve(result);
							}
						}, function reject(e) {
							reject(e);
						});
					} else {
						reject("There is no urls need to be updated");
					}
				});
			} catch (e) {
				logger.error(e);
				reject(e);
			}
		};
		// Drop outdated cache
		return cache[type].remove({url: {$in: urls}, time: {$lt: now}})
			.then(function () {
				// Find cached results
				return db.find(type, {url: {$in: urls}, time: {$gt: now}}).then(function (items) {
					for (var i in items) {
						cachedResults.push(items[i]);

						var inx = urls.indexOf(items[i].url);
						if (inx > -1) {
							urls.splice(inx, 1);
						}
					}
					// No URLs to process. All results are cached and up-to-date.
					if (!urls.length) {
						resolve({status: true, message: '', results: cachedResults});
					} else {
						doLoad();
					}
				});
			});
	});
};

function configPath() {
	var envPath = process.env.PATH;
//	var casperjsPath = __dirname + "../../node_modules/casperjs/batchbins";
//	envPath += ";" + casperjsPath;
//	var phantomjsPath = __dirname + "../../node_modules/.bin//phantomjs";
//	envPath += ";" + phantomjsPath;
	return envPath;
}
exports.links = function (urls, locale, retailer, expiration) {
	return _load(urls, "links", locale, retailer, expiration);
};
exports.details = function (urls, locale, retailer, expiration) {
	return _load(urls, "details", locale, retailer, expiration);
};

exports.retailersList = function (locale) {
	return new Promise(function (resolve, reject) {
		var dir = __dirname + '/sites/' + locale + '/';
		var scripts = [];
		fs.readdir(dir, function (err, files) {
			if (err) {
				return reject(err);
			}
			async.each(files, function (file, callback) {
				fs.stat(dir + file, function (err, stats) {
					scripts.push(file);
					callback();
				});
			}, function (err) {
				if (err) {
					return reject(err);
				}
				resolve(scripts);
			});
		});
	});
};
