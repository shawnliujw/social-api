var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitForSelector("#bloqueblanco", function() {
		try {
			var price = this.fetchText("#bloqueblanco #our_price_display");
			price = Price.format(price, 2);
			if (price) {
				json.stock = "in-stock";
				json.price_now = price;
				json.status = true;
			} else {
				json.message = "price error";
			}
			json.title = this.fetchText("#bloqueblanco > h1");
			json.image = this.getElementAttribute("#image-block img", "src");
			json.description = this.getHTML("#descripcion");

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