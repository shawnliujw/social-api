var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitForSelector("#price_feature_div", function() {
		try {
			var stock = this.fetchText("#availability");
			if (stock) {
				json.status = true;
                stock = stock.toLowerCase();
				if (stock.indexOf("en stock") !== -1) {
					json.stock = "in-stock";
				} else {
					json.stock = "out-of-stock";
				}
				var price = this.fetchText("#price tbody > tr");
				if (price) {
					json.price_was = Price.format(price, 2);
				}
				price = this.fetchText("#priceblock_ourprice");
				price = Price.format(price, 2);
				if (price) {
					json.price_now = price;
				} else {
					json.status = false;
					json.message = "price error";
				}
			} else {
				json.message = "stock error";
			}
			json.title = this.fetchText("#productTitle");
			json.image = this.getElementAttribute("#imgTagWrapperId img", "src");
			if (casper.exists("#product-description-iframe")) {
				casper.withFrame(0, function() {
					if (this.exists("#productDescription")) {
						json.description = this.evaluate(function(){
                            var node = document.querySelector("#productDescription");
                            return node ? node.innerHTML : "";
                        });
					}
				});
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		json.message = "Wait timeout for page selector '#price_feature_div'";
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#rightResultsATF .prod .newaps a", function() {
		var urls = this.getElementsAttribute("#rightResultsATF .prod .newaps a", "href");
		var names = this.getElementsAttribute("#rightResultsATF .prod .newaps a span", "title");
		var products = new Array();
		for (var i = 0; i < urls.length; i++) {
			products.push({
				name: names[i],
				url: urls[i]
			});
		}
		json.products = products;
		json.status = true;
		callback(json);

	}, function ontimeout() {
		json.message = "Timeout for selector '#rightResultsATF .prod .newaps a'";
		callback(json);
	}, timeout);
};