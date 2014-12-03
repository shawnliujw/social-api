var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {status: false};
	casper.waitUntilVisible("body", function() {
		try {
			var price = Price.format(this.fetchText("#ContentPlaceHolder1_ctrlMainProduct_ProductDetailsAndPrice .price .value"), 2);
			json.image = "http://www.pharmacy2u.co.uk" + this.getElementAttribute("#ContentPlaceHolder1_ctrlMainProduct_imgProduct", "src");
			json.title = Offer.format(this.fetchText(".col-product-details > h2"));
			json.description = this.getHTML("#sitemiddlecolumn .prodDetPage .col3non .col3.main");
			if (price) {
				json.price_now = price;
				json.message = "OK";
				json.stock = 'in-stock';
				json.price_was = Price.format(this.fetchText("#ContentPlaceHolder1_ctrlMainProduct_litRRP"), 2);
				var offerText = this.fetchText("#ContentPlaceHolder1_ctrlMainProduct_ProductDetailsAndPrice .price .discount");
				if (offerText && offerText.indexOf("% OFF") === -1) {
					json.offer = Offer.format(offerText);
				} else {
					json.offer = "";
				}
				json.status = true;
			} else {
				json.message = "price error";
				json.price_now = null;
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		json.message = "timeout waiting for selector img.html5gallery-elem-image-0 to be visible"
		callback(json);
	}, timeout);
};


// loading status  #nxt-status
exports.search = function(casper, timeout, callback) {
	var json = {
		"status": false
	};
//		casper.on('remote.message', function(msg) {
//			this.echo(msg);
//		});
	// return new Promise(function (resolve, reject) {
	casper.waitWhileVisible("#nxt-status", function() {
		if (this.exists("#sitemiddlecolumn .searchResultsSearchPage > h2")) {
			json.status = false;
			json.message = this.fetchText("#sitemiddlecolumn .searchResultsSearchPage > h2");
		} else {
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll("#productsearchresults .col1non a.titleURL");
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					var name = nodes[i].innerText.replace(/[\t\n\x0B\f\r]/g, "");

					// pharmacy2u uses a redirect
					var m = /^http\:\/\/pharmacy2u\.ecomm\-nav\.com\/redirect\?url\=(.*)/.exec(nodes[i].href);
					var linkURL = (m && m.length) ? decodeURIComponent(m[1]) : nodes[i].href;
					var product = {
						"name": name,
						"url": linkURL
					};
					temp.push(product);
				}
				return temp;
			});
			if (products) {
				json.products = products;
				json.status = true;

			} else {
				json.message = "Invalid selector '#productsearchresults .col1non a.titleURL'";
			}
		}

		callback(json);
	}, function onTimeout() {
		// reject(json);
		json.message = "Wait timeout for selector '#nxt-status'";
		callback(json);
	}, timeout);
	// });
};