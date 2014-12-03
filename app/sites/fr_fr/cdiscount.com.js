var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitForSelector("#fpBlocPrice", function() {
		try {
			json.status = true;
			if (!this.exists(".fpSoldOut")) {
				json.stock = "in-stock";
				var price = this.fetchText(" #fpBlocPrice .price");//fpStriked
				price = Price.format(price, 2);
				if (price) {
					json.price_now = price;
				} else {
					json.status = false;
					json.message = "price error";
				}
				price = this.fetchText(" #fpBlocPrice .fpStriked");//fpStriked
				price = Price.format(price, 2);
				if (price) {
					json.price_was = price;
				}
			} else {
				json.stock = "out-of-stock";
			}
			json.image = this.getElementAttribute(".fpMainImg > a", "href");
			json.title = this.getElementAttribute(".fpMainImg > a", "alt");
			json.description = this.evaluate(function() {
				var nodes = document.querySelectorAll(".fpBlk");
				var tmp = "";
				if (nodes && nodes.length > 0) {
					tmp = nodes[0].innerHTML;
				}
				return tmp;
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		if (casper.getCurrentUrl().length < 25) {
			json.stock = "notfound";
			json.status = true;
		} else {
			json.message = "Wait timeout for page selector '#fpBlocPrice'";
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#lpContent ", function() {
			casper.scrollToBottom();
			var urls = casper.getElementsAttribute("#lpContent   a ", "href");
			var names = casper.getElementsAttribute("#lpContent   a.lpBImg", "alt");
			var products = new Array();
			for (var i = 0; i < urls.length; i++) {
				products.push({
					"name": names[i],
					"url": urls[i]
				});
			}
			json.products = products;
			json.status = true;
			callback(json);
		}, function onTimeout() {
			callback(json);
		}, timeout);
	} catch (e) {
		json.message = e.message;
		callback(json);
	}
};