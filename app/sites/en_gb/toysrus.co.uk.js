var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
        var json = {"status": false};
        casper.waitUntilVisible("#content .product_panel .purchasing_section .pricing .price", function() {
                try {
                        var stock = this.fetchText("#content .product_panel .purchasing_section .purchase_options  .home_delivery_out_of_stock");
                        json.title = this.getElementAttribute("#Zoomer img", "alt");
                        json.image = this.getElementAttribute("#Zoomer img", "src");
                        json.description = this.getHTML(".specifications_overview");
                        if (stock) {
                                json.stock = "out-of-stock";
                                json.status = true;
                        } else {
                                stock = this.fetchText("#content .product_panel .purchasing_section .purchase_options  .home_delivery_available_message");
                                if (stock) {
                                        if (stock.indexOf("Not available") !== -1) {
                                                json.stock = "out-of-stock";
                                                json.status = true;

                                        } else {
                                                json = _fetchPrice(casper, json);
                                        }
                                } else {
                                        json.message = "stock error";
                                }
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

function _fetchPrice(casper, json) {
        var price = casper.fetchText("#content .product_panel .purchasing_section .pricing .price");
        price = Price.format(price, 2);
        if (price) {
                json.price_now = price;
                json.stock = 'in-stock';
                json.status = true;
                json.message = "OK";
                price = casper.fetchText("#content .product_panel .purchasing_section .pricing .previous_price");
                if (price) {
                        json.price_was = Price.format(price, 2);
                }
                var offerText = casper.fetchText("#content .product_panel .purchasing_section .promo_title");
                if (offerText) {
                        json.offer = Offer.format(offerText);
                }
        } else {
                json.message = "price error";
        }
        return json;
}

exports.search = function(casper, timeout, callback) {
        var json = {"status": false};
        try {
                casper.waitUntilVisible(".search_results", function() {
                        casper.scrollToBottom();
                        var products = casper.evaluate(function() {
                                var nodes = document.querySelectorAll(".search_results .under_best_match .product_image a");
                                var temp = new Array();
                                for (var i = 0; i < nodes.length; i++) {
                                        temp.push({
                                                "name": nodes[i].title,
                                                "url": nodes[i].href
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