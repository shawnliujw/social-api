var Price = require("../../../util/price");
var Offer = require("../../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#productWrapper ", function() {
		try {
			json.status = true;
			if (casper.exists(".unavailableMsg")) {
				json.stock = "out-of-stock";
			} else {
				var price = this.fetchText("#productWrapper .descriptionDetails  .addToBasket .price .linePrice");
				price = Price.format(price, 2);
				if (price) {
					json.price_now = price;
					json.stock = 'in-stock';
					var offerText = this.fetchText("#productWrapper .descriptionDetails .descContent  .promo a em");
					if (offerText) {
						json.offer = Offer.format(offerText);
						var valid = this.fetchText("#productWrapper .descriptionDetails .descContent  .promo .promoDate");
						valid = Offer.validity(valid);
						if (valid) {
							json.validity = valid;
						}
					}
				} else {
					json.message = "price error";
				}
			}
			json.description = this.getHTML("#productWrapper .productDetailsDisclaimer");
			json.image = this.getElementAttribute(".productImage img", "src");
			json.title = this.fetchText("#productWrapper h1 span");
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		if (casper.exists(".noProdsAvlbl")) {
			json.message = "This product is not available.";
			json.status = true;
			json.status = "out-of-stock";
		} else {
			json.message = "Wait timeout for page selector '#productWrapper'";
		}
		callback(json);
	}, timeout);
};

exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible(".headerContent .searchResults strong", function() {
			var totalCount = casper.fetchText(".headerContent .searchResults strong");
			totalCount = parseInt(totalCount);
			_load();
			var products = new Array();
			function _load() {
				//casper.echo(casper.fetchText(".productLists .products .first a"));
				casper.scrollToBottom();
				casper.waitUntilVisible(".productLists .products li a img", function() {
					var products1 = casper.evaluate(function() {
						var nodes = document.querySelectorAll(".productLists .products li .inBasketInfoContainer a");
						var temp = new Array();
						for (var i = 0; i < nodes.length; i++) {
							//var href = nodes[i].href;
							//if (href.indexOf("groceries/Product/Details/?id") !== -1) {
							temp.push({
								"name": nodes[i].innerText,
								"url": nodes[i].href
							});
							//}
						}
						return temp;
					});
					products = products.concat(products1);
//					if (this.exists(".searchFooter .nextWrap .next a")) {
//						this.click(".searchFooter .nextWrap .next a");
//						this.waitForSelectorTextChange(".productLists .products .first a", function() {
//							_load();
//						});
//					} else {
					json.products = products;
					json.status = true;
					callback(json);
					//}
				}, function() {
					json.products = products;
					json.message = "Waittimeout for selector  '.productLists'";
					json.status = false;
					callback(json);
				});
			}

		}, function onTimeout() {
			json.message = "timeout for selector '.headerContent .searchResults strong'";
			callback(json);
		}, timeout);
	} catch (e) {
		json.message = e.message;
		callback(json);
	}
};