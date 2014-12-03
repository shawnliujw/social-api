var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function (casper, timeout, callback) {
    var json = {"status": false};
    casper.waitUntilVisible(".details-top", function () {
        try {
            var stock = this.fetchText("#pd-stock .stock-label");
            if (stock) {
                // todo relying on text case is quite brittle
                stock = stock.toLowerCase();
                if (stock.indexOf("in stock") !== -1) {
                    json.stock = "in-stock";
                } else if (stock.indexOf("no longer available") !== -1) {
                    json.stock = "notfound";
                } else if (stock.indexOf("not available to purchase online") !== -1) {
                    json.stock = "out-of-stock";
                } else if (stock.indexOf("date available") !== -1) {
                    json.stock = "in-stock";
                } else if (stock.indexOf("low stock") !== -1) {
                    json.stock = "in-stock";
                } else {
                    json.stock = "in-stock";
                }

                var price = this.fetchText(".details-top .pricing-delivery .pricing .price");
                json.image = this.getElementAttribute("#productImage-0", "href");
                json.title = Offer.format(this.fetchText(".title-and-code h1 span.title"));
                json.description = this.getHTML("#description-container");
                if (price) {
                    json.price_now = Price.format(price, 2);
                    price = this.fetchText(".details-top .pricing-delivery .pricing .was");
                    if (price) {
                        json.price_was = Price.format(price, 2);
                    }
                    json.status = true;
                    var offerText = this.fetchText(".details-top  .pricing-delivery .promotion-texts .promotion");
                    if (offerText) {
                        var index = offerText.indexOf("Click here for full");
                        if (index !== -1) {
                            offerText = offerText.substring(0, index);
                        }
                        json.offer = Offer.format(offerText);
                    }
                } else {
                    json.message = "price error";
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
        json.message = "Wait timeout for page selector";
        callback(json);
    }, timeout);
};
exports.search = function (casper, timeout, callback) {
    var json = {"status": false};
    var productArray = new Array();
    _page();
    function _page() {
        try {
            casper.waitUntilVisible("#product-listing", function () {
                var products = casper.evaluate(function () {
                    var nodes = document.querySelectorAll("#product-listing .listing-products .items .product a.product-name");
                    var temp = new Array();
                    for (var i = 0; i < nodes.length; i++) {
                        var name = nodes[i].innerText;
                        var product = {
                            "name": name,
                            "url": nodes[i].href
                        };
                        if (name.indexOf("Transformers") !== -1) {
                            if (name.indexOf("Transformers: ") === -1) {
                                temp.push(product);
                            }
                        } else {
                            temp.push(product);
                        }

                    }
                    return temp;
                });
                productArray = productArray.concat(products);
//				if (this.exists("#ctl00_ctl00_rootZoneMain_ZoneMain_NavBar1_hlNext")) {
//					this.click("#ctl00_ctl00_rootZoneMain_ZoneMain_NavBar1_hlNext");
//					_page();
//				} else {
                json.products = productArray;
                json.total = productArray.length;
                json.status = true;
                callback(json);
                //}

            }, function ontimeout() {
                callback(json);
            }, timeout);
        } catch (e) {
            json.message = e.message;
            callback(json);
        }
    }
};