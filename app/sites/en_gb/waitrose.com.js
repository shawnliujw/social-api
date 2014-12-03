var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#content .product-detail", function() {
		try {
			var outofstock = this.fetchText("#content  .r-content  .product-unavailable");
			json.image = this.getElementAttribute(".product-image a", "href");
			json.title = this.getElementAttribute(".product-image a img", "alt");
			json.description = this.getHTML(".summary .product-info");
			if (outofstock && outofstock.indexOf("is not available") === -1) {
				json.status = true;
				json.message = "OK";
			} else {
				var price = this.fetchText("#content .product-detail .price strong");
				price = Price.format(price, 2);
				if (price) {
					json.price_now = price;
					json.stock = 'in-stock';
					json.status = true;
					price = this.fetchText("#content .product-detail .offer-container .oldPrice");
					if (price) {
						json.price_was = Price.format(price, 2);
					}
					var offerText = this.fetchText("#content .product-detail .offer-container a");
					if (offerText.indexOf("Brand Price Match") === -1) {
						if (price) {
							offerText = offerText.replace(price, "");
						}
						json.offer = Offer.format(offerText);
					}
				} else {
					json.message = "price error";
				}
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		json.message = "Wait timeout for page selector";
		callback(json);
	}, timeout);
};

exports.search = function(casper, timeout, callback) {
	var json = {
		"status": false
	};
	// return new Promise(function (resolve, reject) {
	casper.waitUntilVisible(".search-results-listing .r-content .products-grid .m-product-cell", function() {
		casper.scrollToBottom();
		var urls = casper.getElementsAttribute(".search-results-listing .products-grid .m-product-cell .m-product-details-container > a", "href");
		var names = casper.getElementsAttribute(".search-results-listing .products-grid .m-product-cell .m-product-padding > a img", "alt");
		var products = new Array();
		for (var i = 0; i < names.length; i++) {
			products.push({
				name: names[i],
				url: "http://www.waitrose.com" + urls[i]
			});
		}
		json.products = products;
		json.status = true;
		callback(json);
	}, function onTimeout() {
		// reject(json);
		json.message = "Wait timeout for selector '.search-results-listing .products-grid .m-product-cell'";
		callback(json);
	}, timeout);
	// });
};