var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
    json.stock = "out-of-stock";
	casper.waitUntilVisible("#buy_block", function() {
		try {
			var price = this.fetchText("#buy_block #our_price_display");
			price = Price.format(price, 2);
			if (price) {
                json.stock = "in-stock";
				json.price_now = price;
				json.status = true;
				price = this.fetchText("#buy_block #old_price_display");
				price = Price.format(price, 2);
				if (price) {
					json.price_was = price;
				}
				var offer = this.fetchText("#buy_block .price .discount");
				offer = Offer.format(offer);
				if (offer) {
					json.offer = offer;
				}
			} else {
				json.message = "price error";
			}
			json.title = casper.fetchText("#primary_block > h1");
			json.image = casper.getElementAttribute("#bigpic", "src");
			json.description = casper.evaluate(function() {
				var node = document.querySelector("#idTab1");
				return node ? node.innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var selector = "#center_column .error";
		if (casper.exists(selector) && casper.fetchText(selector).indexOf("no encontrado") !== -1) {
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
	casper.waitUntilVisible(".ajax_block_product", function() {
//		var urls = this.getElementsAttribute(".ajax_block_product > a", "href");
//		var names = this.getElementsAttribute(".listado_productos .datos_producto a", "title");
//		var products = new Array();
//		for (var i = 0; i < urls.length; i++) {
//			products.push({
//				name: names[i],
//				url: urls[i]
//			});
//		}
		var products = this.evaluate(function() {
			var nodes = document.querySelectorAll(".ajax_block_product > a");
			var tmp = [];
			nodes.forEach(function(node) {
				tmp.push({
					"url": node.href,
					"name": node.title
				});
			});
			return tmp;
		});
		json.products = products;
		json.status = true;
		callback(json);

	}, function ontimeout() {
		json.message = "Timeout for selector '.listado_productos'";
		callback(json);
	}, timeout);
};