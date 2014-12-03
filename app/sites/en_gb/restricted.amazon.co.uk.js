var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {
		"status": false
	};
	casper.waitUntilVisible("#availability", function() {

		try {

			var stock = this.fetchText("#availability");
			var merchantInfo = this.fetchText("#merchant-info");
			if (stock) {
				json.status = true;
				if (merchantInfo && merchantInfo.toLowerCase().indexOf("sold by amazon") >= 0
						&& stock.toLowerCase().indexOf("in stock") >= 0) {
					json.stock = "in-stock";
				} else {
					json.message = merchantInfo + " " + stock;
					json.stock = "out-of-stock";
				}
				var price = this.fetchText("#priceblock_ourprice");
				if (price) {
					json.price_now = Price.format(price, 2);
					price = this.fetchText("#price td.a-text-strike");
					price = Price.format(price, 2);
					if (price) {
						json.price_was = price;
					}
				} else {
					json.status = false;
					json.message = "price error";
				}

				json.title = this.fetchText("#productTitle");
				json.image = this.getElementAttribute("#landingImage", "src");
				if (this.exists("#iframe-wrapper")) {
					this.withFrame(0, function() {
						if (this.exists("#productDescription")) {
							json.description = this.getHTML("#productDescription");
						}
					});
				}
			} else {
				json.status = false;
				json.message = "stock error";
			}

		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		json.message = "Wait timeout for page selector '#availability'";
		callback(json);
	}, timeout);
};
//pagnNextLink
exports.search = function(casper, timeout, callback) {
	var json = {
		status: false,
		products: []
	};

	// return new Promise(function (resolve, reject) {
	_page();

	function _page() {
		casper.then(function() {
			this.scrollToBottom();
			try {
				casper.waitWhileVisible("#centerBelowPlusspacer", function() {
					var info = this.getElementsInfo("#atfResults .newaps a");
					if (info && info.length) {
						info.forEach(function(item) {
							json.products.push({
								url: item.attributes.href,
								name: item.text
							});
						})
					}
					json.status = true;
					callback(json);
				});
			} catch (e) {
				json.message = e.message;
				callback(json);
			}
		});
	}
};