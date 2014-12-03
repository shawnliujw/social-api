var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".blocklista", function() {
		try {
			var price = this.fetchText(".blocklista .prize strong");
			price = Price.format(price, 2);
			if (price) {
				json.status = true;
				json.price_now = price;
				json.stock = "in-stock";
			} else {
				json.message = "price error";
			}
			json.title = this.fetchText(".blocklista > h2");
			json.image = "http://www.carrefouronline.carrefour.es" + this.getElementAttribute("#imgPrincipal", "src");//
			if (casper.exists("#pnlul1")) {
				json.description = this.getHTML("#pnlul1");
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		if (casper.getCurrentUrl().indexOf("noalimentacion/HomeTecnologia.aspx") !== -1) {
			json.message = "Wait timeout for page selector '.blocklista'";
		} else {
			json.stock = "notfound";
			json.status = true;
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#rightResultsATF .prod .newaps a", function() {
		var urls = this.getElementsAttribute("#rightResultsATF .prod .newaps a", "href");
		var names = this.getElementsAttribute("#rightResultsATF .prod .newaps a span", "title");
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
		json.message = "Wait timeout for selector '#rightResultsATF .prod .newaps a'";
		callback(json);
	}, timeout);
};