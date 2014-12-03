var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitForSelector("#fch_caja_precio", function() {
		try {
			var price = this.fetchText("#fch_caja_precio span h2");
			json.status = true;
			price = Price.format(price, 2);
			if (price) {
				json.stock = "in-stock";
				json.price_now = price;
				price = this.evaluate(function() {
					var nodes = document.querySelectorAll(".fch_precio_anterior");
					return nodes && nodes.length > 0 ? nodes[0].text : "";
				});
				price = Price.format(price, 2);
				if (price) {
					json.price_was = price;
				}
				var offer = this.evaluate(function() {
					var nodes = document.querySelectorAll(".fch_precio_anterior");
					return nodes && nodes.length > 1 ? nodes[1].text : "";
				});
				json.offer = Offer.format(offer);
			} else {
				json.message = "price error";
				json.status = false;
			}
			json.title = casper.fetchText(".fch_caja_datosprod h1");
			json.image = casper.getElementAttribute(".fch_caja_img > a", "href");
			json.description = casper.evaluate(function() {
				var node = document.querySelector("#options-description");
				return node ? node.innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		//json.message = "Wait timeout for page selector '#fch_caja_precio'";
		//callback(json);
        handlePage(casper, timeout, callback);
	}, timeout);
};

function handlePage(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitForSelector("#pricing .product-price", function() {
		try {
			var price = this.fetchText("#pricing .product-price .current");
			json.status = true;
			price = Price.format(price, 2);
			if (price) {
                json.status = true;
				json.stock = "in-stock";
				json.price_now = price;
				price = this.fetchText("#pricing .product-price .former");
				price = Price.format(price, 2);
				if (price) {
					json.price_was = price;
				}
			} else {
				json.message = "price error";
				json.status = false;
			}
			json.title = casper.fetchText(".product-information > h3 > a");
			json.image = casper.getElementAttribute("#product-image-placer", "src");
			json.description = casper.evaluate(function() {
				var node = document.querySelector("#options-description");
				return node ? node.innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
        if(casper.exists(".caja_cont_jquery")) {
            json.stock = "notfound";
            json.status = true;
        } else {

            json.message = "Wait timeout for page selector '#fch_caja_precio' and '#pricing .product-price' ";
        }
		callback(json);
	}, timeout);
}

exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".listado_imagencuadrada", function() {
		var urls = this.getElementsAttribute(".listado_imagencuadrada a", "href");
		var names = this.getElementsAttribute(".llistado_imagencuadrada a img", "title");
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
		json.message = "Timeout for selector '.listado_imagencuadrada'";
		callback(json);
	}, timeout);
};