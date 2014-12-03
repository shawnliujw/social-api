var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#ctl00_ctl05_pnl_variedades_1", function() {
		try {
			var price = this.fetchText("#ctl00_ctl05_pnl_variedades_1 #ctl00_ctl05_ctl00_lbl_precio_producto_2");
			price = Price.format(price, 2);
			if (price) {
				json.status = true;
				json.stock = "in-stock";
				json.price_now = price;
				price = this.fetchText("#ctl00_ctl05_pnl_variedades_1 #ctl00_ctl05_ctl00_precio_antes .negro span");
				price = Price.format(price, 2);
				if (price) {
					json.price_was = price;
				}
				var offer = this.fetchText("#ctl00_ctl05_pnl_variedades_1 #ctl00_ctl05_ctl00_div_descuento");
				offer = Offer.format(offer);
				if (offer) {
					json.offer = offer;
				}
			} else {
				json.message = "price error";
			}
			json.title = this.fetchText("#ctl00_ctl05_titulo_producto");
			json.image = this.getElementAttribute("#ctl00_ctl05_img_producto_1","src");//
			if (casper.exists("#ctl00_ctl05_info_producto")) {
				json.description = this.getHTML("#ctl00_ctl05_info_producto");
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		//not found was handle by casper server , http status code 404
		json.message = "Wait timeout for page selector '#ctl00_ctl05_pnl_variedades_1'";
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".listado_productos .datos_producto", function() {
		var urls = this.getElementsAttribute(".listado_productos .datos_producto a", "href");
		var names = this.getElementsAttribute(".listado_productos .datos_producto a", "title");
		var products = new Array();
		for (var i = 0; i < urls.length; i++) {
			products.push({
				name: names[i],
				url: urls[i]
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