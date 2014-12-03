/**
 * Created by liujianwei on 2014/9/26.
 */
var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function (casper, timeout, callback) {
    var json = {
        "status": false
    };
    casper.waitUntilVisible("#page > div.content > div.prod-detail > div.main", function success() {
        var stock = casper.fetchText("#addToCartForm > div.prod-price-stock > div.stock-info.variant-changeable > div:nth-child(2) > div");
        if (stock) {
            json.status = true;
            if (stock.indexOf("In Stock") !== -1) {
                json.stock = "in-stock";
            } else {
                json.stock = "out-of-stock";
            }
            var price = casper.fetchText("#addToCartForm > div.prod-price-stock > div.prod-price > span.price");
            if (price && Price.format(price, 2)) {
                price = Price.format(price, 2);
                json.price_now = price;
                price = casper.fetchText("#addToCartForm > div.prod-price-stock > div.prod-price > span.was-price");
                if (price && Price.format(price, 2)) {
                    json.price_was = price;
                }
                var offer = casper.evaluate(function(){
//                   var node = document.querySelector('#page > div.content > div.prod-detail > div.main > div.prod-basic > div.prod-deals > p');
//                    return node ? node.innerText : "";
                    var node = $("#page > div.content > div.prod-detail > div.main > div.prod-basic > div.prod-deals > p");
                    node.find("a").remove();
                    node.find("span").remove();
                    return node.text();
                });
                if (offer) {
                    json.offer = Offer.format(offer);
                }
            } else {
                json.status = false;
                json.message = "price error";
            }
        } else {
            json.message = "stock error";
        }
        //body > div.main_container > div.content_container.single_column > div > div.content_main > div > div > div.details.hproduct > div > div > h1
        json.title = casper.fetchText("#page > div.content > div.prod-detail > div.main > div.prod-basic > h1");
        json.image = casper.getElementAttribute("#hero", "src");
        json.description = casper.getHTML("#tab-description > div > div");
        callback(json);
    }, function failed() {
        //notfound was handled by parent with http status=404
        json.message = "Wait timeout for selector '#page > div.content > div.prod-detail > div.main'";
        callback(json);
    }, timeout);
}

exports.search = function (casper, timeout, callback) {
    var json = {
        "status": false
    }
    casper.waitUntilVisible("#page > div.content > div.inner-content.has-aside > div.main > div.product-listing", function success() {
        json.status = true;
        json.products = casper.evaluate(function () {
            var products = [];
            var nodes = document.querySelectorAll("#page > div.content > div.inner-content.has-aside > div.main > div.product-listing > ul .product .name-heading a");
            if (nodes && nodes.length > 0) {
                for (var i = 0; i < nodes.length; i++) {
                    products.push({
                        name: nodes[i].title,
                        url: nodes[i].href
                    });
                }
            }
            return products;
        });
        callback(json);
    }, function failed() {
        var notfoundSelect = "#page > div.content > div.inner-content > div > div > h1";
        if (casper.exists(notfoundSelect)) {
            json.status = true;
            json.message = casper.fetchText(notfoundSelect);
            json.products = [];
        } else {
            json.message = "Wait timeout for selector '.#page > div.content > div.inner-content.has-aside > div.main > div.product-listing'";
        }

        callback(json);
    }, timeout);
}