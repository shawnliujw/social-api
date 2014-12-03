/**
 * Created by liujianwei on 2014/9/26.
 */
var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function (casper, timeout, callback) {
    var json = {
        "status": false
    };
    casper.waitUntilVisible("#bodyA > table:nth-child(4)", function success() {
        var price = casper.fetchText(".ItemDetailPrice");
        price = Price.format(price,2);
        if (price) {
            json.price_now = price;
            price = casper.fetchText(".ItemDetaildontPay");
            if (price && Price.format(price, 2)) {
                json.price_was = price;
            }
        } else {
            json.status = false;
            json.message = "price error";
        }
        //body > div.main_container > div.content_container.single_column > div > div.content_main > div > div > div.details.hproduct > div > div > h1
        json.title = casper.fetchText(".ItemDetailName");
        json.image = casper.getElementAttribute("#Zoomer2", "href");
        json.description = casper.evaluate(function () {
            var node = document.querySelector("#bodyA > table:nth-child(4) > tbody > tr > td > table > tbody > tr > td:nth-child(2) > div.Font10 > p");
            return node ? node.innerHTML : "";
        });
        callback(json);
    }, function failed() {

        var notfoundSelect = "#bodyA > div.Cat_content > table.Font10Bold.textBlue > tbody > tr:nth-child(1) > td:nth-child(1)";
        if (casper.exists(notfoundSelect) && casper.fetchText(notfoundSelect).indexOf("0 to 0") !== -1) {
            json.message = "invalid product url";
            json.status = true;
            json.stock = "notfound";
        } else {
            json.message = "Wait timeout for selector '#bodyA > table:nth-child(4)'";
        }
        callback(json);
    }, timeout);
}

exports.search = function (casper, timeout, callback) {
    var json = {
        "status": false
    }
    casper.waitUntilVisible("#bodyA > .Cat_content", function success() {
        json.status = true;
        var notfoundSelect = "#bodyA > div.Cat_content > table.Font10Bold.textBlue > tbody > tr:nth-child(1) > td:nth-child(1)";
        if (casper.exists(notfoundSelect) && casper.fetchText(notfoundSelect).indexOf("0 to 0") !== -1) {
            json.message = "Didn't find products.";
            json.products = [];
        } else {
            json.products = casper.evaluate(function () {
                var products = [];
                var baseUrl = "http://www.mrtoys.com.au";
                var nodes = document.querySelectorAll("#bodyA > div.Cat_content > table:nth-child(2) > tbody > tr .ItemDetailName a");
                if (nodes && nodes.length > 0) {
                    for (var i = 0; i < nodes.length; i++) {
                        products.push({
                            name: nodes[i].innerHTML,
                            url: baseUrl + nodes[i].href
                        });
                    }
                }
                return products;
            });
        }
        callback(json);
    }, function failed() {
        json.message = "Wait timeout for selector '#bodyA > .Cat_content'";
        callback(json);
    }, timeout);
}