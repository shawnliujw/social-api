var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function (casper, timeout, callback) {
    var json = {"status": false};
    casper.waitUntilVisible("#galleryImages .first a", function () {
        try {
           // var oos = this.fetchText("#bopRight .oos");
            json.image = "http://www.ocado.com" + this.getElementAttribute("#galleryImages .first a", "href");
            json.title = Offer.format(this.fetchText(".productTitle strong"));
            json.description = casper.evaluate(function () {
                var node = document.querySelector('#bopBottom > div:nth-child(2) > p');
                return node ? node.innerHTML : "";
            });
           // if (oos) {
                json.status = true;
                //if (oos.indexOf("Out of stock") !== -1) {
                if(casper.exists(".productPrice .productAdd")) {
                    json.stock = "in-stock";
                } else {
                    json.stock = "out-of-stock";
                }
                var price = this.fetchText("#bopRight .productPrice .typicalPrice .nowPrice");
                if (!price) {
                    price = this.fetchText("#bopRight .productPrice .typicalPrice");
                }
                price = Price.format(price, 2);
                if (price) {
                    json.price_now = price;
                    price = this.fetchText("#bopRight .productPrice .typicalPrice .wasPrice");
                    price = Price.format(price,2);
                    if(price) {
                        json.price_was = price;
                    }
                    var offerText = this.fetchText("#bopRight .productDescription .onOffer a");
                    if (offerText && offerText.indexOf("Meal Deal") === -1) {
                        json.offer = Offer.format(offerText);
                    }
                } else {
                    //json.status = false;
                    //json.message = "price error";
                    json.stock = "out-of-stock";
                }

           // } else {
           //     json.message = "stock error";
            //}
        } catch (e) {
            json.status = false;
            json.message = e.message;
        }
        callback(json);
    }, function onTimeout() {
        var selector = "#content .indent h2";
        if (casper.exists(selector) && casper.fetchText(selector).indexOf("don't have") !== -1) {
            json.status = true;
            json.stock = "notfound";
        } else {
            json.message = "Wait timeout for page selector '#galleryImages .first a'";
        }
        callback(json);
    }, timeout);
};


exports.search = function (casper, timeout, callback) {
    var json = {"status": false};

    casper.waitUntilVisible("#prodList", function () {
        var products = casper.evaluate(function () {
            var nodes = document.querySelectorAll("#prodList .productDetails .productTitle a");
            var temp = [];
            for (var i = 0; i < nodes.length; i++) {
                var name = nodes[i].innerText;
                var pURL = nodes[i].href;
                pURL = pURL.substr(0, pURL.indexOf("?"));
                var product = {
                    "name": name,
                    "url": pURL
                };
                temp.push(product);
            }
            return temp;
        });
        json.products = products;
        json.status = true;
        callback(json);

    }, function ontimeout() {
        callback(json);
    }, timeout);
};

