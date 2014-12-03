var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
    var json = {"status": false};
    casper.waitUntilVisible(".product-detail form .image-box img", function() {
        try {
            var price = casper.fetchText(".productDetails  p.price span");
            price = Price.format(price, 2);
            if (price) {
                json.status = true;
                json.price_now = price;
                json.stock = 'in-stock';
                json.image = "http://www.weldricks.co.uk" + this.getElementAttribute(".product-detail form .image-box .larger-image a", "src");
                json.title = Offer.format(this.fetchText(".product-detail form > h1"));
                json.description = this.getHTML("#tab-container #uses");
                var price_was = this.fetchText(".productDetails p.rrp");

                price_was = Price.format(price_was, 2);
                if (price_was) {
                    json.price_was = price_was;
                }
//				var offer = casper.fetchText("#pdpDetails #pdpProductInformation #pdpPricing .saving");
//				offer = Offer.format(offer);
//				if (offer) {
//					json.offer = offer;
//				}
            } else {
                json.message = "price error";
            }
        } catch (e) {
            json.status = false;
            json.message = e.message;
        }
        callback(json);
    }, function onTimeout() {
        json.message = "Wait timeout for page selector";
		callback(json);
    }, timeout);
};
exports.search = function(casper, timeout, callback) {
    var json = {"status": false};
    casper.scrollToBottom();
    casper.waitUntilVisible("#right .thumb-list-entry", function() {
        try {
            var products = casper.evaluate(function() {
                var nodes = document.querySelectorAll("#right .thumb-list-entry .thumb-list-top p a");
                var temp = new Array();
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
        } catch (e) {
            json.message = e.message;
        }
        callback(json);
    }, function timeout() {
        callback(json);
    }, timeout);
};