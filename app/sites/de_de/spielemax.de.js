var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".product-shop", function() {
		try {
			var price = this.fetchText(".product-shop .product-view-special-price .price");
			price = Price.format(price, 2);
			if (price) {
				json.stock = "in-stock";
				json.price_now = price;
				price = this.fetchText(".product-shop .product-view-old-price .old-price");
				price = Price.format(price, 2);
				if (price) {
					json.price_was = price;
				}
				var offer = this.fetchText(".product-shop .product-view-old-price .savings-txt");
				offer = Offer.format(offer);
				if (offer) {
					json.offer = Offer.format(offer);
				}
				json.status = true;
			} else {
				price = this.fetchText(".product-shop .product-view-regular-price .price");
				price = Price.format(price, 2);
				if (price) {
					json.stock = "in-stock";
					json.price_now = price;
					json.status = true;
				} else {
					json.message = "price error";
				}
			}
			json.title = casper.fetchText(".product-name");
			json.image = casper.getElementAttribute("#main_image", "src");
			json.description = casper.evaluate(function() {
				var node = document.querySelector(".box-description > div.std");
				return node ? node.innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var selector = '.page-title';
		if (casper.exists(selector) && casper.fetchText(selector).indexOf("unsere Schuld") !== -1) {
			json.stock = "notfound";
			json.status = true;
		} else {
			json.message = "Wait timeout for page selector '.product-shop'";
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible(".item-name", function() {
			casper.scrollToBottom();
			var urls = casper.getElementsAttribute(".item-name a", "href");
			var names = casper.getElementsAttribute(".item-name a", "title");
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