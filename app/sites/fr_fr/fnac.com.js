var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#content", function() {
		try {
			var stock = this.fetchText("#content .dispoAndSeller");
			if (stock) {
				if (stock.toLowerCase().indexOf("en stock") !== -1) {
					json.stock = "in-stock";
				} else {
					json.stock = "out-of-stock";
				}
				var price = this.fetchText("#content .bigPricerFA .userPrice");
				price = Price.format(price, 2);
				if (price) {
					json.status = true;
					json.price_now = price;
				} else {
					json.message = "price error";
				}
			} else {
				json.message = "stock error";
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var currentUrl = casper.getCurrentUrl();
		if (currentUrl < 20) {
			json.stock = "notfound";
			json.status = true;
		} else {
			json.message = "Wait timeout for page selector";
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	var products = new Array();
	casper.then(function() {
		casper.scrollToBottom();
		try {
			casper.waitUntilVisible("#dontTouchThisDiv", function() {
				var urls = casper.evaluate(function() {
					var nodes = document.querySelectorAll("#dontTouchThisDiv .articleList .descProduct .h2 a");
					var temp = new Array();
					for (var i = 0; i < nodes.length; i++) {
						temp.push({
							"url": nodes[i].href,
							"name": nodes[i].innerText
						});
					}
					return temp;
				});
				products = products.concat(urls);
//					if (this.exists(".bottom-toolbar .nextLevel1 a")) {
//						if (products.length > total + 1) {
//							json.products = products;
//							json.total = products.length;
//							json.status = true;
//							callback(json);
//						} else {
//							casper.click(".bottom-toolbar .nextLevel1 a");
//							_page();
//						}
//					} else {
				json.products = products;
				json.status = true;
				callback(json);
				//}

			}, function ontimeout() {
				json.status = false;
				callback(json);
			}, timeout);
		} catch (e) {
			json.message = e.message;
			callback(json);
		}
	});
};