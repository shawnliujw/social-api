var Price = require("../../util/price");
var Offer = require("../../util/offer");
var Promise = require('bluebird');

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".mainImage .s7staticimage > img", function() {
		try {
			if (this.exists("#pd_rdf_product .out_of_stock_help")) {
				json.stock = "out-of-stock";
				json.status = true;
			} else {
				var price = this.fetchText("#pd_rdf_product .productOfferPrice");
				var point = this.fetchText("#pd_rdf_product .productOfferPrice  .pointsPrice");
				if (point) {
					price = price.replace(point, "");
				}
				price = Price.format(price, 2);
				if (price) {
					json.price_now = price;
					json.stock = 'in-stock';
					json.status = true;
					price = this.fetchText("#pd_rdf_product .productSavings .oldPrice");
					var offerText = null;
					if (price) {
						json.price_was = Price.format(price, 2);
						offerText = this.fetchText("#pd_rdf_product .productSavings .save");
						if (offerText) {
							json.offer = Offer.format(offerText);
						}
					} else {
						offerText = this.fetchText("#pd_rdf_product .primaryItemDeal p");
						if (offerText) {
							if (offerText.indexOf("Triple points") === -1) {
								json.offer = Offer.format(offerText);
							}
						}
					}
				} else {
					json.message = "price error";
				}
				json.image = this.getElementAttribute(".mainImage .s7staticimage > img", "src");
				json.title = this.fetchText("#pd_rdf_product .pd_productNameSpan");
				json.description = this.getHTML("#productDescriptionContent");
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		// resolve(json);
		callback(json);
	}, function onTimeout() {
		if (casper.exists(".genericHTML h1") && casper.fetchText(".genericHTML h1").indexOf("we couldn't find this page") !== -1) {
			json.status = true;
			json.stock = "notfound";
		} else {
			json.message = "Wait timeout for page selector '.mainImage .s7staticimage > img'";
		}
		callback(json);
	}, timeout);
};

exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.log("evaluating", 'info');
		var products = casper.evaluate(function() {
			var nodes = document.querySelectorAll("#ProductViewListGrid .pl_productName a.productName");
			var temp = [];
			console.log("boots.com::found " + nodes.length + " matching nodes");
			for (var i = 0; i < nodes.length; i++) {
				temp.push({
					"name": nodes[i].innerText,
					"url": nodes[i].href
				});
			}
			return temp;
		});
		json.products = products;
		json.status = true;
		callback(json);

	} catch (e) {
		json.message = e.message;
		callback(json);
	}

	/*
	casper.waitUntilVisible(".searchResultsSummary", function() {

		var titles = casper.getElementsInfo("#right-col h1");
		for (var i = 0; i < titles.length; i++) {
			if (titles.text && title.text.toLowerCase().indexOf("no result") >= 0) {
				noResult = true;
				break;
			}
		}

		json.products = casper.evaluate(function() {
			var nodes = document.querySelectorAll("#product-tiles .productgroup .details a");
			var temp = [];
			for (var i = 0; i < nodes.length; i++) {
				temp.push({
					"name": nodes[i].innerText,
					"url": nodes[i].href
				});
			}
			return temp;
		});
		json.status = true;
		callback(json);

	}, function() {
		var noResult = false;
		try {
			var titles = casper.getElementsInfo("#right-col h1");
			for (var i = 0; i < titles.length; i++) {
				if (titles.text && title.text.toLowerCase().indexOf("no result") >= 0) {
					noResult = true;
					break;
				}
			}
		} catch(e) {
			// fall through
		}

		if (noResult) {
			json.products = [];
			json.status = true;
		} else {
			json.status = false;
			json.message = "no elements could be used to derive data from the page.";
		}

		callback(json);
	}, timeout);

} catch (e) {
	json.message = e.message;
	callback(json);
}
*/
};
