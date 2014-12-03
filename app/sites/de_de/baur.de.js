var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".priceMainContainer", function() {
		try {
			var price = this.fetchText(".priceMainContainer .priceMainBox #price_dv");
			price = Price.format(price, 2);
			if (price) {
				json.stock = "in-stock";
				json.price_now = price;
				price = this.fetchText(".priceMainContainer  #oldPriceContainer");
				price = Price.format(price, 2);
				if (price) {
					json.price_was = price;
				}
				var offer = this.fetchText(".priceMainContainer .priceMainBox #prozent_dv");
				offer = Offer.format(offer);
				if (offer) {
					json.offer = Offer.format(offer);
				}
				json.status = true;
			} else {
				json.message = "price error";
			}
			json.title = this.fetchText(".productHeadline");
			json.image = this.getElementAttribute("#main_img_link", "href");
			json.description = this.getHTML("#longDescription");
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var selector = '.contentHeadline .globalHeader27';
		if (casper.exists(selector) && casper.fetchText(selector).indexOf("die gesuchte") !== -1) {
			json.stock = "notfound";
			json.status = true;
		} else {

			json.message = "Wait timeout for page selector '.priceMainContainer'";
		}

		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#boxModelRight .productlistWrapper #productlist", function() {
			casper.scrollToBottom();
			var urls = casper.getElementsAttribute("#boxModelRight \n\
                        .productlistWrapper #productlist .row-price-availability .cell-content ul li a", "href");
			var names = casper.getElementsAttribute(".image-product img ", "title");
			var products = this.evaluate(function() {
				var nodes = document.querySelectorAll("#boxModelRight \n\
                        .productlistWrapper #productlist .row-price-availability .cell-content ul li a");
				var tmp = new Array();
				nodes.forEach(function(node) {
					tmp.push({
						"name": node.innerHTML,
						"url": node.href
					})
				});
				return tmp;
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