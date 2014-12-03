var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {

	casper.waitUntilVisible("#availability", function() {
		var json = {
			"status": false
		};
		try {
			var stock = this.fetchText("#availability_feature_div");
			if (stock) {
				json.status = true;
				stock = stock.toLowerCase();
				//if (stock.indexOf("sold by Amazon") !== -1 || stock.indexOf("Fulfilled by Amazon") !== -1) {
				if (stock.indexOf("in stock") !== -1 && stock.indexOf("unavailable") === -1) {
					json.stock = "in-stock";
				} else {
                    json.stock = "out-of-stock";
                }
                var price = this.fetchText("#priceblock_ourprice");//handle normally price
                if (price) {
                    json.price_now = Price.format(price, 2);
                } else if(this.fetchText("#priceblock_saleprice")) {// handle Price-Sale
                    price = this.fetchText("#priceblock_saleprice");
                    json.price_now = Price.format(price, 2);
                }
                price = this.fetchText("#price td.a-text-strike");
                price = Price.format(price, 2);
                if (price) {
                    json.price_was = price;
                }

				json.title = this.fetchText("#productTitle");
				json.image = this.getElementAttribute("#landingImage", "src");
				if (this.exists("#iframe-wrapper")) {
					this.withFrame(0, function() {
						if (this.exists("#productDescription")) {
							json.description = this.evaluate(function(){
                                var node = document.querySelector("#productDescription");
                                return node ? node.innerHTML : "";
                            });
						}
					});
				}

			} else {
				json.message = "stock error";
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		json.message = "Wait timeout for page selector '#availability'";
		callback(json);
	}, timeout);
};
//pagnNextLink
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};

	// return new Promise(function (resolve, reject) {
	_page();

	function _page() {
		casper.then(function() {
			this.scrollToBottom();
			try {
				casper.waitWhileVisible("#centerBelowPlusspacer", function() {
					var searchResultsElements = this.getElementsInfo('#atfResults .newaps a', 'href'); //
					json.products = searchResultsElements.reduce(function(arr, el) {
						arr.push({
							url: el.attributes.href,
							name: el.text
						});
						return arr;
					}, []);
					json.status = true;
					callback(json);
				});
			} catch (e) {
				json.message = e.message;
				callback(json);
			}
		});
	}
	// });

	// console.log('Searching for amazon');
};