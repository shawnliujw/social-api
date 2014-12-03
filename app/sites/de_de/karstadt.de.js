var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".product-add-to-cart", function() {
		try {
			var price = this.fetchText(".product-add-to-cart .price-sales");
			price = Price.format(price, 2);
			if (price) {
				json.stock = "in-stock";
				json.price_now = price;
			} else {
				json.message = "price error";
			}
			json.title = this.fetchText("#pdpMain .product-name");
			json.image = this.getElementAttribute("#pdpMain .product-image-container .product-primary-image a", "href");
			//json.description = this.getHTML("#pdpMain .description .long.js_slidetogglecontent");
			json.description = this.evaluate(function() {
				var node = document.querySelector("#pdpMain .description .long.js_slidetogglecontent");
				return node ? node.innerHTML : "";
			});
			json.status = true;
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var selector = "#primary";
		if (casper.exist(selector) && casper.fetchText(selector).indexOf("konnte leider nicht gefunden") !== -1) {
			json.stock = "notfound";
			json.status = true;
		} else {
			json.message = "Wait timeout for page selector '.product-add-to-cart'";
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#search-result-items", function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll("#search-result-items .grid-tile .product-name  a");
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