
var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".layoutPdsRightColumn", function() {
		try {
			var price = this.fetchText(".layoutPdsRightColumn #pdsPriceSum");
			price = Price.format(price, 2);
			if (price) {
				json.stock = "in-stock";
				json.price_now = price;
				json.status = true;
			} else {
				json.message = "price error";
			}
			json.title = this.fetchText(".productHeading");
			json.image = this.getElementAttribute("#pdsMainProductImage", "src");
			json.description = this.getHTML("#cmp_productdatasheet");
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		if (casper.exists("#buehneSlider")) {
			json.stock = "notfound";
			json.status = true;
		} else {
			json.message = "Wait timeout for page selector '.layoutPdsRightColumn'";
		}
		callback(json);
		;
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#main .productName", function() {
			casper.scrollToBottom();
			var urls = casper.getElementsAttribute("#main .module_PUE3_1x1_3erKachel a", "content");
			var names = casper.getElementsAttribute("#main .module_PUE3_1x1_3erKachel a img", "title");
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