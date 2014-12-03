var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {
		"status": false
	};

	// return new Promise(function (resolve, reject) {
	casper.waitUntilVisible("#productDetail", function() {
		try {
			var price, was_price;
			if (this.exists("#productDetail form fieldset .price .productPrice .newPrice")) {
				price = this.fetchText("#productDetail form fieldset .price .productPrice .newPrice");
				was_price = this.fetchText("#productDetail form fieldset .price .productPrice .wasPrice");
			} else if (this.exists("#productDetail form fieldset .price .productPrice .pounds")) {
				price = this.fetchText("#productDetail form fieldset .price .productPrice .pounds");
			}
			json.price_now = Price.format(price, 2);
			json.price_was = Price.format(was_price, 2);
			if (json.price_now) {
				json.status = true;
				json.stock = 'in-stock';
				var offerText = this.fetchText("#productDetail form .callOut .promotionName");
				if (offerText) {
					json.offer = Offer.format(offerText);
				}
			}
            if (this.exists("#outofstockbtn")) {
				json.price_now = null;
				json.stock = "out-of-stock";
			}
			json.description = this.getHTML("#descriptionsContent");
			json.image = this.getElementAttribute("#zoomanchor", "href");
			json.title = this.fetchText("#productView #productDetail form h1");


			// resolve(json);
			callback(json);

		} catch (e) {
			json.status = false;
			json.message = e.message;
			// reject(json);
			callback(json);
		}
	}, function onTimeout() {
		// reject(json);
//		if (casper.exists("#itemDetails .item-unavailable-holder")) {
//			json.price_now = null;
//			json.stock = "out-of-stock";
//		}
		if (casper.exists(".noResultTitle") && casper.fetchText(".noResultTitle")) {
			json.stock = "notfound";
			json.status = true;
		} else {
			json.message = "Wait timeout for page selector";
		}
		callback(json);
	}, timeout);
	// });
};
exports.search = function(casper, timeout, callback) {
	var json = {
		"status": false
	};
	// return new Promise(function (resolve, reject) {
	casper.waitUntilVisible("#SearchedFor", function() {
		casper.scrollToBottom();
		var urls = casper.getElementsAttribute(".listItem .productImg a", "href");
		var names = casper.getElementsAttribute(".listItem .productImg a img", "alt");
		var products = new Array();
		for (var i = 0; i < names.length; i++) {
			products.push({
				name: names[i],
				url: urls[i]
			})
		}
		json.products = products;
		json.status = true;
		callback(json);
	}, function onTimeout() {
		// reject(json);
		callback(json);
	}, timeout);
	// });
};