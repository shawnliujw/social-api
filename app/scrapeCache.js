var logger = require("node-config-logger").getLogger("lib/scrapeCache.js");
var config = require("config");
var Promise = require("bluebird");
var retailerScripts = require("./retailer");
var db = require('mongo-bluebird').create(config.scrapecache.db);
var moment = require("moment");

var cache = {
	details: db.collection("details"),
	links: db.collection("links")
};

exports.clear = function(type, urls, locale, retailer) {
	return retailerScripts.get(urls, locale, retailer)
		.then(function(scripts) {
			var files = scripts.map(function(script) {
				return script.retailerFile.split('/').slice(-1).join('/');
			});
			return cache[type].remove({script: {$in: files}, url: {$in: urls}});
		});
};

exports.find = function(type, url, expiration) {
	var validDate = moment().subtract(expiration || 0, 'hours').toDate();
	return cache[type].find({url: url, time: {$gte: validDate}}).then(function(data) {
		logger.info("retrieved " + (data && data.length) + " cached scrape results.");
		return data;
	});
};

exports.put = function(type, data) {
	if (!Array.isArray(data)) {
		data = [data];
	}
	var promises = data.reduce(function (arr, el) {
		arr.push(cache[type].upsert({
			url: el.url
		}, el));
		return arr;
	}, []);
	return Promise.all(promises)
		.then(function () {
			logger.info("Cached " + data.length + " scrape results.");
		})
		.catch(function (err) {
			logger.info("Failed to cache " + data.length + " scrape results: ", err);
		});
};