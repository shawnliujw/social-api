var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#pdpDetails #pdpProductInformation #pdpPricing .actualprice .price", function() {
		try {
			var price = casper.fetchText("#pdpDetails #pdpProductInformation #pdpPricing .actualprice .price");
			price = Price.format(price, 2);
			if (price) {
				json.status = true;
				json.price_now = price;
				json.stock = 'in-stock';
				json.image = this.evaluate(function() {
					var imgs = document.querySelectorAll("#pdpDetails #main .s7carousel-main-image-slide-vertical");
					return imgs[0].src;
				});
				json.title = Offer.format(this.fetchText("#pdpProduct h1.fn"));
				json.description = this.getHTML(".fullDetails");
				var price_was = this.fetchText("#pdpDetails #pdpProductInformation #pdpPricing .wasprice");

				price_was = Price.format(price_was, 2);
				if (price_was) {
					json.price_was = price_was;
				}
				var offer = casper.fetchText("#pdpDetails #pdpProductInformation #pdpPricing .saving");
				offer = Offer.format(offer);
				if (offer) {
					json.offer = offer;
				}
			} else {
				json.message = "price error";
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var selector = '#contentarea .error';
		if (casper.exists(selector) && casper.fetchText(selector).indexOf("we are unable")) {
			json.status = true;
			json.stock = "notfound";
		} else {
			json.message = "Wait timeout for page selector";
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.scrollToBottom();

	try {
		var products = casper.evaluate(function() {
			var productsContainer = document.querySelectorAll("#products");

			if (!productsContainer || !productsContainer.length) {
				return [{
						"name": document.querySelectorAll("#pdpProduct h1.fn")[0].innerText,
						"url": this.currentUrl
					}];
			}

			var nodes = document.querySelectorAll("#products .product .title a");
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

	} catch (e) {
		json.message = e.message;
		callback(json);
	}
};