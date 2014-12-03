/**
 * Created by liujianwei on 2014/9/26.
 */
var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function (casper, timeout, callback) {
    var json = {
        "status": false
    };
    casper.waitUntilVisible("#c54 > table:nth-child(4) > tbody > tr > td > form", function success() {
//        var stock = casper.fetchText("#subform > ol > li.available > span");
//        if (stock) {
//            json.status = true;
//            if (stock.indexOf("Available Now") !== -1) {
//                json.stock = "in-stock";
//            } else {
//                json.stock = "out-of-stock";
//            }
        var price = casper.fetchText("div.prodPrice span.price");
        if (price && Price.format(price, 2)) {
            price = Price.format(price, 2);
            json.price_now = price;
            json.status = true;
            json.stock = "in-stock";
           // price = casper.fetchText("#selection_price > p.price_was");
//                if (price && Price.format(price, 2)) {
//                    json.price_was = price;
//                }
//                var offer = casper.fetchText("#selection_price > p.price_save");
//                if (offer) {
//                    json.offer = Offer.format(offer);
//                }
        } else {
            //json.status = false;
           // json.message = "price error";
            json.status = true;
            json.stock = "out-of-stock";
        }
//        } else {
//            json.message = "stock error";
//        }
        json.title = casper.fetchText(" div.detailWrapper > div.prodTitle");
        json.image = casper.getElementAttribute("#wrap > a:nth-child(1)", "href");
        json.description = casper.getHTML("#pfProductTabs144Content");
        callback(json);
    }, function failed() {
        json.message = "Wait timeout for selector '#c54 > table:nth-child(4)'";
        callback(json);
    }, timeout);
}

exports.search = function (casper, timeout, callback) {
    var json = {
        "status": false
    }
    casper.waitUntilVisible("#searchResultsPane", function success() {
        json.status = true;
        var notfoundSelect = "#searchResultsPane > div";
        if (casper.exists(notfoundSelect) && casper.fetchText(notfoundSelect).indexOf("No Matches") !== -1) {
            json.message = casper.fetchText(notfoundSelect);
            json.products = [];
        } else {

            json.products = casper.evaluate(function () {
                var products = [];
                var nodes = document.querySelectorAll("#searchResultsPane  div.searchResultValue  a");
                if (nodes && nodes.length > 0) {
                    for (var i = 0; i < nodes.length; i++) {
                        products.push({
                            name: nodes[i].innerHTML,
                            url: nodes[i].href
                        });
                    }
                }
                products.map(function(product){
                    product.name = Offer.format(product.name);
                    return product;
                });
                return products;
            });
        }
        callback(json);
    }, function failed() {
        json.message = "Wait timeout for selector '#searchResultsPane'";
        callback(json);
    }, timeout);
}