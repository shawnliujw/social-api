var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitForSelector("#price_feature_div", function() {
		try {
			var stock = this.fetchText(" #availability");
			if (stock) {
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
                price = this.fetchText(" #priceblock_ourprice");
                price = Price.format(price, 2);
                if (price) {
                    json.price_now = price;
                } else {
                    json.message = "price error";
                }
                json.status = true;
			} else {
				json.message = "stock error";
			}
			json.title = this.fetchText("#productTitle");
			json.image = this.getElementAttribute("#imgTagWrapperId img", "src");
			if (casper.exists("#product-description-iframe")) {
				casper.withFrame(0, function() {
					json.description = this.evaluate(function(){
                        var node = document.querySelector("#productDescription");
                        return node ? node.innerHTML : "";
                    });
				});
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		json.message = "Wait timeout for page selector #price_feature_div";
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#atfResults .newaps", function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll("#atfResults .prod  a");
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					temp.push({
						"name": nodes[i].innerText,
						"url": nodes[i].href
					});
				}
				return temp;
			});
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