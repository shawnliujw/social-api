var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitForSelector(".doublecolumn_main", function() {
		try {
			var price = this.fetchText(".doublecolumn_main .product_price > div > strong");
			price = Price.format(price, 2);
			if (price) {
				json.stock = "in-stock";
				json.price_now = price;
				json.status = true;
			} else {
				json.message = "price error";
			}
			json.title = this.fetchText(".product_detail > h1");
			json.image = "http://juguettos.com" + this.getElementAttribute("#product_mainphoto a", "href");
			json.description = this.getHTML(".product_info");

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
	var json = {"status": false};
	casper.waitUntilVisible(".cuerpo-articulo", function() {
		var urls = this.getElementsAttribute(".cuerpo-articulo > div > div a", "href");
		var names = this.getElementsAttribute(".cuerpo-articulo > div > div a img", "alt");
		var products = new Array();
		for (var i = 0; i < urls.length; i++) {
			products.push({
				name: names[i].replace("imagen", ""),
				url: "http://www.juguetilandia.com" + urls[i]
			});
		}
		json.products = products;
		json.status = true;
		callback(json);

	}, function ontimeout() {
		json.message = "Timeout for selector '.listado_productos'";
		callback(json);
	}, timeout);
};