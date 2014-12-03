var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#amp-container", function() {
		try {
			var stock = this.fetchText("#main #addToCartForm .stockMessaging .indicator");
			json.title = this.fetchText(".productHeading");
			json.image = this.getElementAttribute(".amp-zoom-overflow img", "src");
			//json.description = this.getHTML('span[itemprop="description"]');
			json.description = this.evaluate(function() {
				var node = document.querySelector('span[itemprop="description"');
				return node ? node.innerHTML : "";
			});
			if (stock) {
				//if (stock.indexOf("sold by Amazon") !== -1 || stock.indexOf("Fulfilled by Amazon") !== -1) {
				if (stock.toLowerCase().indexOf("in stock") !== -1) {
					json.stock = "in-stock";
				} else {
					json.status = "out-of-stock";
				}
				var price = this.fetchText("#main #addToCartForm .productCashPrice .priceWas");
				if (price) {
					json.price_was = Price.format(price, 2);
				}
				price = this.fetchText("#main #addToCartForm .productCashPrice .priceNow");
				price = Price.format(price, 2);
				if (price) {
					json.status = true;
					json.price_now = price;
					var offerText = this.fetchText("#main #addToCartForm .productCashPrice .productSavePrice");
					if (offerText) {
						json.offer = Offer.format(offerText);
					}
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
		if (casper.getCurrentUrl().length < 24) {
			json.stock = "notfound";
			json.status = true;
		} else {
			json.message = "Wait timeout for page selector '#amp-container'";
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#products", function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll("#products .product .productInfo  .productTitle");
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
			// Timed out - No #products selector on the page, check for h1.productHeading (separate product page)
			casper.waitUntilVisible("h1.productHeading", function() {
				var productName = this.evaluate(function() {
					return document.querySelectorAll("h1.productHeading")[0].innerText;
				});

				var products = [{
						"name": productName,
						"url": this.currentUrl
					}];

				callback({
					status: true,
					products: products
				});
			}, function onTimeout() {
				// Timed out - No h1.productHeading selector
				callback(json);
			}, timeout);

		}, timeout);
	} catch (e) {
		json.message = e.message;
		callback(json);
	}
};