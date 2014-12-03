var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#addForm2", function() {
		try {
			var stock = this.fetchText("#addForm2 .availability");
			if (stock) {
				if (stock.indexOf("En stock") !== -1) {
					json.stock = "in-stock";
				} else {
					json.stock = "out-of-stock";
				}
				var price = this.fetchText("#addForm2 .priceArea .price");
				price = Price.format(price, 2);
				if (price) {
					json.status = true;
					json.price_now = price;
				} else {
					json.message = "price error";
				}
			} else {
				json.message = "stock error";
			}
			json.title = casper.fetchText("#detailsHeadZone h1.title");
			json.image = casper.getElementAttribute("#picturesZone .picProduct .productPhoto .link-mega-zoom img","src");
			json.description = casper.evaluate(function(){
				var node = document.querySelector("#tabCaracteristiques0 div[align='center']");
				return node ? node.innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		json.message = "Wait timeout for page selector '#addForm2'";
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#listMosaicZone .DefaultProduct", function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll("#listMosaicZone .DefaultProduct > a");
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					temp.push({
						"name": nodes[i].innerText,
						"url": "http://www.auchan.fr"+nodes[i].href
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