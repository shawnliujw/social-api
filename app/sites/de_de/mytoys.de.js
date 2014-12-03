var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".details", function() {
		try {
			var stock = this.fetchText(".details .availMessage");
			if (stock) {
				json.status = true;
				if (stock.indexOf("Vorrätig!") !== -1) {
					json.stock = "in-stock";
				} else {
					json.stock = "out-of-stock";
				}
				var price = this.fetchText(".details .price");
				price = Price.format(price, 2);
				if (price) {
					json.price_now = price;
					var offer = this.fetchText(".details .percent");
					offer = Offer.format(offer);
					if (offer) {
						json.offer = Offer.format(offer);
					}
				} else {
					json.message = "price error";
					json.status = false;
				}
				json.image = this.getElementAttribute(".zoomPopup img", "src");
				json.title = Offer.format(this.fetchText(".details > h1"));
				json.description = this.getHTML("#content1");
			} else {
				json.message = "stock error";
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var selector = '#z0_m_error_404';
		if (casper.exists(selector) && casper.fetchText(selector).indexOf("konnten die gewünschte") !== -1) {
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
	try {
		casper.waitUntilVisible(".catBox", function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll(".catBox .prodTitle  a");
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