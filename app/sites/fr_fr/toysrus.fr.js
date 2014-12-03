var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#buy-interior", function() {
		try {
			var stock = this.fetchText("#buy-interior .DISCONTINUED");
			if (stock) {
                json.status = true;
				//if (stock.indexOf("indisponible sur internet") === -1) {
                if(stock.indexOf("En Stock") !== -1) {
					json.stock = "in-stock";
				}

                var price = this.fetchText("#buy-interior #price .price");
                var priceNow = this.fetchText("#price > dl > dd.ours");
                var priceWas = this.fetchText("#price > dl > dd.list");
                if(priceNow && Price.format(priceNow,2)) {
                    json.price_now = Price.format(priceNow,2);
                    json.price_was = Price.format(priceWas,2);
                } else if(price){
                    price = Price.format(price, 2);
                    json.price_now = price;
                } else {
                    json.status = false;
                    json.message = "price error";
                }
			} else {
				json.message = "stock error";
			}
			json.title = casper.fetchText("#price-review-age > h1");
			json.image = casper.getElementAttribute("#curImageZoom", "src");
			json.description = casper.evaluate(function() {
				var node = document.querySelector("#description-product-tab");
				return node ? node.innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		if (casper.getCurrentUrl().indexOf("home/index.jsp?categoryId") !== -1) {
			json.status = true;
			json.stock = "notfound";
		} else {
			json.message = "Wait timeout for page selector '#buy-interior'";
		}
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#featured-category-boxes", function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll("#featured-category-boxes .featured-category-box .top a");
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					temp.push({
						"name": nodes[i].title,
						"url": "http://www.toysrus.fr" + nodes[i].href
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