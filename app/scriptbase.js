
var Promise = require("./util/promise");
//var Promise = require("bluebird");

exports.details = function(casper, visibleSelector, scrape, timeout) {
	return new Promise(function(resolve, reject) {
		casper.waitUntilVisible(visibleSelector, function() {
			resolve(scrape(casper));
		}, function onTimeout() {
			reject("timeout");
		}, timeout);
	});
};

exports.links = function(casper, visibleSelector, linkSelector, timeout) {
	visibleSelector = visibleSelector || "body";
	return new Promise(function(resolve, reject) {
		casper.waitUntilVisible(visibleSelector, function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				// where is document defined?
				var nodes = document.querySelectorAll(linkSelector);
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					temp.push({
						"name": nodes[i].title,
						"url": nodes[i].href
					});
				}
				return temp;
			});
			resolve(products);
		}, function onTimeout() {
			reject("timeout");
		}, timeout);
	});
};

