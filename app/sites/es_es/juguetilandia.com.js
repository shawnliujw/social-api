var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitForSelector(".fa-datos", function() {
		try {
			var stock = this.fetchText(".fa-datos .fa-disponible font");
			if (stock) {
				json.status = true;
				if (stock.indexOf("Disponible") !== -1) {
					json.stock = "in-stock";
				} else {
					json.stock = "out-of-stock";
				}
				var price = this.fetchText(".fa-datos .fa-precio .fa-precio-grande");
				price = Price.format(price, 2);
				if (price) {
					json.price_now = price;
				} else {
					json.message = "price error";
				}
			} else {
				json.message = "stock error";
			}
			json.title = casper.fetchText(".fa-titulo-titulo h1");
			json.image = casper.getElementAttribute("#image", "src");
			json.description = casper.evaluate(function() {
				var nodes = document.querySelectorAll(".fa-seccion-cuerpo");
				return nodes && nodes.length > 0 ? nodes[0].innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var baseUrl = "http://www.juguetilandia.com/";
		if (casper.getCurrentUrl().length < baseUrl.length + 1) {
			json.stock = "notfound";
			json.status = true;
		} else {
			json.message = "Wait timeout for page selector '.fa-datos'";
		}
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