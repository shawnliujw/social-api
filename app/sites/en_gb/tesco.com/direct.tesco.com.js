var Price = require("../../../util/price");
var Offer = require("../../../util/offer");
exports.fetch = function (casper, timeout, callback) {
    var json = {"status": false};
    casper.waitUntilVisible("#main-content .buy-from .seller", function () {
        try {
            json.status = true;
            //json.description = this.getHTML("#product-details");
            json.description = this.evaluate(function () {
                var node = document.querySelector("#product-details-link > section");
                return node ? node.innerHTML : "";
            });
            json.title = Offer.format(this.fetchText("h1.page-title"));
            json.image = this.getElementAttribute("#scene7-placeholder", "src");

            var stock = this.fetchText(".stock-message");
            if (this.exists(".not-available-tesco") || (stock && stock.indexOf("unavailable") !== -1)) {
                json.stock = "out-of-stock";
            } else {
                json.stock = "in-stock";
                var price = this.fetchText("#main-content .buy-from .seller .seller-price-info .current-price");
                price = Price.format(price, 2);
                if (price) {
                    json.price_now = price;
                    price = this.fetchText("#main-content .buy-from .seller .seller-price-info .old-price del");
                    if (price) {
                        json.price_was = Price.format(price, 2);
                    }
                    var offerText = this.fetchText("#main-content .buy-from .seller .seller-price-info .old-price .saving");
                    if (offerText) {
                        json.offer = Offer.format(offerText);
                    }
                } else {
                    json.status = false;
                    json.message = "price error";
                }
            }

        } catch (e) {
            json.status = false;
            json.message = e.message;
        }
        callback(json);
    }, function onTimeout() {
        json.message = "Wait timeout for page selector '#main-content .buy-from .seller'";
        callback(json);
    }, timeout);
};
// exports.search = function(casper, json, dotter_util, callback, timeout) {
exports.search = function (casper, timeout, callback) {
    var json = {"status": false};
    try {
        casper.waitUntilVisible("#filtered-products-count", function () {
            var totalCount = casper.fetchText("#filtered-products-count strong");
            totalCount = parseInt(totalCount);
            _load();
            function _load() {
                casper.scrollToBottom();
                casper.waitWhileVisible(".loadingBar", function () {
                    var products = casper.evaluate(function () {
                        var nodes = document.querySelectorAll(".product  .title-author-format .dotdotdot  a");
                        var temp = new Array();
                        for (var i = 0; i < nodes.length; i++) {
                            temp.push({
                                "name": nodes[i].innerText,
                                "url": nodes[i].href
                            });
                        }
                        return temp;
                    });
                    // if (products.length === totalCount) {
                    json.products = products;
                    json.status = true;
                    callback(json);
                    //  } else {
                    //	_load();
                    // }
                    //json.products = products;
                    //json.status = true;
                    //callback(json);
                }, function onTimeout() {
                    callback(json);
                }, timeout);
            }

        }, function onTimeout() {
            // No filtered products count found, Check for the case of a particular product page
            casper.waitUntilVisible(".product .title-author-format .dotdotdot a", function () {
                var product = this.evaluate(function () {
                    return {
                        name: document.querySelectorAll(".product .title-author-format .dotdotdot a")[0].innerText,
                        url: 'http://tesco.com/' + document.querySelectorAll(".product .title-author-format .dotdotdot a")[0].getAttribute('href')
                    };
                });

                callback({
                    status: true,
                    products: [product]
                });
            }, function onTimeout() {
                // Timed out - No .product-description .ssb_block h1.page-title
                callback(json);
            }, timeout);


        }, timeout);
    } catch (e) {
        json.message = e.message;
        callback(json);
    }
};