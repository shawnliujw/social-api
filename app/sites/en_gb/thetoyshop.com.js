var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
        var json = {status: false};
        casper.waitUntilVisible("#page_inner .prod_details", function() {
                try {
                        var stock = this.fetchText("#page_inner .prod_details .out_of_stock");
                        json.title = Offer.format(this.fetchText("#productDetailUpdateable .prod_title"));
                        json.image = "http://www.thetoyshop.com" + this.getElementAttribute("#imageLink img", "src");
                        json.description = this.getHTML(".item_content > div");
                        if (stock && stock.indexOf("Out of Stock") !== -1) {
                                json.status = true;
                        } else {
                                var price = this.fetchText("#page_inner .prod_details .prod_price");
                                if (price) {
                                        var wasPrice = this.fetchText("#page_inner .prod_details .prod_price .was_price");
                                        if (wasPrice) {
                                                json.price_was = Price.format(wasPrice, 2);
                                                price = price.replace(wasPrice, "");
                                        }
                                        var offerText = this.fetchText("#page_inner .prod_details .prod_price .product_saving");
                                        if (offerText) {
                                                price = price.replace(offerText, "");
                                                json.offer = Offer.format(offerText);
                                        }
                                        price = Price.format(price, 2);
                                        if (price) {
                                                json.price_now = price;
                                                json.stock = 'in-stock';
                                                json.status = true;

                                        }
                                } else {
                                        json.message = "price error";
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
exports.search = function(casper, timeout, callback) {
        var json = {"status": false};
        try {
                casper.waitUntilVisible("#product_listing", function() {
                        casper.scrollToBottom();
                        var products = casper.evaluate(function() {
                                var nodes = document.querySelectorAll("#product_listing .prod_list .prod_name  a");
                                var temp = new Array();
                                var baseUrl = "http://www.thetoyshop.com";
                                for (var i = 0; i < nodes.length; i++) {
                                        temp.push({
                                                "name": nodes[i].innerText,
                                                "url": baseUrl + nodes[i].href
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