var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#buy-find #buy-interior", function() {
		try {
            //buy-find
			var stock = this.fetchText("#buy-find .in-stock");
			var pre_order = this.fetchText("#buy-find .pre-order");
			if (stock || pre_order) {
				json.status = true;
				if ((stock && (stock.indexOf("nicht verfügbar") === -1 || stock.indexOf("Versand") !== -1)) || (pre_order)) {
					json.stock = "in-stock";
				} else {
					json.stock = "out-of-stock";
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
                    json.message = "price error";
                }
			} else {
				json.message = "stock error";
			}
			json.title = casper.fetchText("#price-review-age h1");
			json.image = casper.getElementAttribute("#curImageZoom","src");
			json.description = casper.evaluate(function(){
				var node = document.querySelector("#description-product-tab > p");
				return node ? node.innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		if (casper.getCurrentUrl().indexOf("home/index.jsp") !== -1) {
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
		casper.waitUntilVisible(".TRU-product-summary-view", function() {
			casper.scrollToBottom();
			var urls = casper.getElementsAttribute(".TRU-product-summary-view a.thumbnail", "href");
			var names = casper.getElementsAttribute(".TRU-product-summary-view a.thumbnail img", "alt");
			var products = new Array();
			var baseUrl = "http://www.toysrus.de";
			for (var i = 0; i < urls.length; i++) {
				products.push({
					"name": names[i],
					"url": baseUrl + urls[i]
				});
			}
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