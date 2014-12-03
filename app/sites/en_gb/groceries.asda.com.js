var Price = require("../../util/price");
var Offer = require("../../util/offer");


// switch to mobile url
// the cache buster is needed to make phantom clear up its state when processing
// multiple asda groceries urls in a row, as they are all the same URL with a hash
exports.redirect = function(url) {
	if (url.indexOf("m.groceries.asda.com") < 0) {
		var m = /([^\/]+)$/.exec(url);
		var cacheBuster = ((new Date()).getTime() % 1000000);
		if (m) {
			url = "http://m.groceries.asda.com/?_=" + cacheBuster + "#item/" + m[1];

		}
	}
	return url;
};

exports.fetch = function(casper, timeout, callback) {
	casper.waitUntilVisible(".product-details", function () {
		//this.capture(".runtime/success-m.groceries.asda.com.png");
		callback(_detailsMobile(this));
	}, function onTimeout() {
		var json = {};
		json.status = false;
		json.message = "Wait timeout for page selector '.product-details'";
		//this.capture(".runtime/timeout-m.groceries.asda.com.png");
		callback(json);
	}, timeout);
};

/*
exports.fetch = function(casper, timeout, callback) {
	casper.wait(5000, function() {
		retry(casper, timeout, callback, 1);
	});
};
*/

function retry(casper, timeout, callback, count) {
	casper.waitUntilVisible("#itemDetails .prod-price", function() {
		callback(_details(this));
	}, function onTimeout() {
		var json = {};
		if (this.exists(".noResultTitle")) {
			json.status = true;
			json.stock = "notfound";
		} else {
			if (count > 0) {
				//casper.reload(function() {
				retry(casper, timeout, callback, count - 1);
				//});
			} else if (casper.visible(".item-unavailable")) {
				json.stock = "out-of-stock";
				json.status = true;
				callback(json);
			} else {
				json.status = false;
				json.message = "Wait timeout for page selector '#itemDetails .prod-price'";
				this.capture(".runtime/groceries.asda.com.png");
				callback(json);
			}
		}
	}, timeout);
}

function _details(casper) {
	var json = {};
	try {
		json.status = true;
		if (casper.visible(".item-unavailable")) {
			json.stock = "out-of-stock";
		} else {
			json.stock = "in-stock";
		}
		var price = casper.fetchText("#itemDetails .prod-price");
		if (price) {
			var point = casper.fetchText("#itemDetails .prod-price .prod-quantity");
			if (point) {
				price = price.replace(point, "");
			}
			price = Price.format(price, 2);
			if (price) {
				json.price_now = Price.format(price, 2);
				var offerText = casper.fetchText("#itemDetails #linksavelink");
				if (offerText) {
					if (offerText.indexOf("Triple points") === -1) {
						json.offer = Offer.format(offerText);
					}
				}
			}
		} else {
			json.message = "price error";
		}
		json.image = casper.getElementAttribute("#product-img-big .pd-img-big img", "src");
		json.title = Offer.format(casper.fetchText("#itemDetails .prod-title"));
		json.description = casper.getHTML("#prodDescription");
	} catch (e) {
		json.status = false;
		json.message = e.message;
	}
	return json;
}

function _detailsMobile(casper) {
	var json = {};
	try {
		if (casper.exists(".error-page")) {
			json.status = true;
			json.stock = "notfound";
		} else {
			json.status = true;
			json.stock = (casper.visible(".item-unavailable")) ? "out-of-stock" : "in-stock";

			var price = casper.fetchText(".product-details .pricing-section .item-price");
			if (price) {
				json.price_now = Price.format(price, 2);
				json.price_str = price;
				if (json.price_now) {
					var offerText = casper.fetchText("body > div > div.main-content > div:nth-child(2) > div > div.item-info > a.promo-flag");
					if (offerText) {
						if (offerText.indexOf("Triple points") === -1) {
							json.offer = Offer.format(offerText);
						}
					}
				}
			}

			json.image = casper.getElementAttribute(".product-details .info-image img", "src");
			json.title = Offer.format(casper.fetchText(".product-details .item-title"));
			json.description = casper.getElementsInfo(".product-details .item-module .module-content")[0].html;
		}
	} catch (e) {
		json.status = false;
		json.message = e.message;
	}
	return json;
}

//loading div #loaderDiv
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#listings", function() {
			_load();
			var products = new Array();
			var t = casper.fetchText(".itemCount");
			var t1 = t.split("of")[1];
			t1 = t1.replace(/[^\d]/g, "");
			var total = parseInt(t1);
			function _load() {
				//casper.echo(casper.fetchText(".productLists .products .first a"));
				casper.scrollToBottom();
				casper.waitWhileVisible("#loaderDiv", function() {
					var names = casper.getElementsAttribute("#listings .listing .container .product .title a", "title");
					var urls = casper.getElementsAttribute("#listings .listing .container .product .title a", "href");
					var temp = new Array();
					for (var i = 0; i < names.length; i++) {
						temp.push({
							"name": names[i],
							"url": urls[i].replace("#/", "http://groceries.asda.com/")
						});
					}
					products = products.concat(temp);
//					if (this.exists(".listings-pagination-wrapper a.forward-listing") && total>products.length) {
//						this.click(".listings-pagination-wrapper a.forward-listing");
//						_load();
//					} else {
					json.products = products;
					json.status = true;
					callback(json);
					//}
				}, function() {
					json.products = products;
					json.message = "Waittimeout for selector  '#loaderDiv'";
					json.status = false;
					callback(json);
				});

//				if (products.length === totalCount) {
//					json.products = products;
//					json.status = true;
//					callback(json);
//				} else {
//					_load();
//				}
			}

		}, function onTimeout() {
			json.message = "timeout for selector '#listings'";
			callback(json);
		}, timeout);
	} catch (e) {
		json.message = e.message;
		callback(json);
	}
};