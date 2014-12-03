var Price = require("../../../util/price");
var Offer = require("../../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		if (casper.exists("#content a.process")) {
			casper.then(function() {
				casper.waitForSelector('#content a.process', function() {
					casper.click('#content a.process');
					//casper.capture("2.png");
				}, function onTimeout() {
					callback(json);
				}, timeout);
			}).waitForText("Great Offers", function() {
				casper.thenOpen(casper.url, function(data) {
					if (data.status) {
						if (data.status === 200) {
							fetchPrice(casper, json, timeout, callback);
						} else {
//							json.message = "Invalid URL.";
							json.status = true;
							json.stock = "notfound";
							callback(json);
						}
					} else {
						json.message = "Connection issue.";
						callback(json);
					}
				});
			}, function onTimeout() {
				json.message = "Error when redirect from session page to product page.";
				callback(json);
			}, timeout);
		} else {
			fetchPrice(casper, json, timeout, callback);
		}
	} catch (e) {
		json.status = false;
		json.message = e.message;
		callback(json);
	}

};

function fetchPrice(casper, json, timeout, callback) {
	casper.waitUntilVisible(".productSummary", function() {
		json.status = true;
		var stock = casper.fetchText(".addToTrolleyForm .messageBox");
		if (stock && stock.indexOf("not available") !== -1) {
			json.stock = "out-of-stock";
		} else {
			json.stock = 'in-stock';
		}
		var price = casper.fetchText(".pricePerUnit");
		if (price) {
			json.price_now = Price.format(price, 2);
			json.description = this.getHTML(".productText");
			json.image = "http://www.sainsburys.co.uk" + this.getElementAttribute(" .productSummary > img", "src");
			json.title = this.fetchText(".productSummary > h1");
			if (casper.exists(".promotion p")) {
				var offer = casper.fetchText(".promotion p");
				if (offer) {
					json.offer = offer;
				}
			}
		} else {
			json.message = "price error";
		}
		callback(json);
	}, function onTimeout() {
		if (casper.exists("#ItemAddError_div_7")) {
			json.status = true;
			json.stock = "notfound";
		} else {
			json.message = "Wait timeout for page selector '.productSummary'";
		}
		callback(json);
	}, timeout);
}

exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#productLister .product .productNameAndPromotions h3 a", function() {
		var products = casper.evaluate(function() {
			var nodes = document.querySelectorAll("#productLister .product .productNameAndPromotions h3 a");
			var temp = [];
			for (var i = 0; i < nodes.length; i++) {
				var name = nodes[i].innerText;
				var product = {
					"name": name,
					"url": nodes[i].href
				};
				temp.push(product);
			}
			return temp;
		});
		json.products = products;
		json.status = true;
		callback(json);

	}, function ontimeout() {
		callback(json);
	}, timeout);
};