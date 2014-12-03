var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#nowPrice", function() {
		try {
			var stock = this.fetchText("#stockStatus");
			if (stock && stock.toLowerCase().indexOf("in stock") !== -1) {
				json.stock = "in-stock";
			} else {
				json.stock = "out-of-stock";
			}
			json.title = Offer.format(this.fetchText(".productHeaderTextInner a"));
			var price = this.fetchText("#nowPrice");
			price = Price.format(price, 2);
			if (price) {
				json.status = true;
				json.price_now = price;
				var offerText = this.fetchText("#savePrice");
				if (offerText) {
					json.offer = Offer.format(offerText);
				}
				price = this.fetchText("#wasPrice");
				price = Price.format(price, 2);
				if (price) {
					json.price_was = price;
				}
			} else {
				json.message = "price error";
			}
			json.description = this.getHTML(".productOverviewPanel");
			json.image = this.evaluate(function() {
				var img = document.querySelector(".zoomWindow");
				return img.style["background-image"];
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		if (casper.getCurrentUrl().indexOf("sol/global_search/global_result.jsp") !== -1) {
			json.status = true;
			json.stock = "notfound";
			json.message = "this is search result page ,not product page.";
		} else if (casper.exists("div.badRequestError")) {
			json.status = true;
			json.stock = "notfound";
		} else {
			json.message = "Wait timeout for page selector '#nowPrice'";
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible(".boxoutInner", function() {
			var products1 = casper.evaluate(function() {
				var nodes = document.querySelectorAll(".grocery-results td.name > a");
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					temp.push({
						"name": nodes[i].innerText,
						"url": nodes[i].href
					});
				}
				return temp;
			});
			var products2 = casper.evaluate(function() {
				var nodes = document.querySelectorAll(".itemDesc h6 > a");
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					temp.push({
						"name": nodes[i].innerText,
						"url": nodes[i].href
					});
				}
				return temp;
			});
			var products = new Array();
			if (products1) {
				products = products.concat(products1);
			}
			if (products2) {
				products = products.concat(products2);
			}
			json.products = products;
			json.status = true;
			callback(json);
		}, function() {
			json.message = "wait timeout for selector '.boxoutInner'";
			callback(json);
		}, timeout);
	} catch (e) {
		json.message = e.message;
		callback(json);
	}
};