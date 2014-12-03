var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".ProduitEntete", function() {
		try {
			var price = this.fetchText(".ProduitEntete .PrixProduit");
			var price1 = this.fetchText(".ProduitEntete .PrixProduit .invisible");
			if (price1) {
				price = price.replace(price1, "");
			}
			price = Price.format(price, 2);
			if (price) {
				json.stock = "in-stock";
				json.price_now = price;
				json.status = true;
			} else {
				json.message = "price error";
			}
			json.title = casper.fetchText(".productDescription > h1");
			json.image = "http://www.lagranderecre.fr" + casper.getElementAttribute("#primary_image > a > img", "src");
			json.description = casper.evaluate(function() {
				var node = document.querySelector("#tabBody-p1");
				return node ? node.innerHTML : "";
			});
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		//notfound has been handled by 404
		json.message = "Wait timeout for page selector '.ProduitEntete'";
		callback(json);
	}, timeout);
};
exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#PageContent", function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll("#PageContent .ResultList .article .libelarti  a");
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					temp.push({
						"name": nodes[i].innerText,
						"url": "http://www.king-jouet.com/" + nodes[i].href.replace('../../../', "")
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
