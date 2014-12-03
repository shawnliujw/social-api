/**
 * Created by liujianwei on 2014/9/26.
 */
var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function (casper, timeout, callback) {
    var json = {
        "status": false
    };
    casper.waitUntilVisible(".main-product-block", function success() {
        var price = casper.fetchText("#WC_CachedProductOnlyDisplay_div_4 > span.price > span.price-now");
        var price_was = null;
        if(price) {
            var totalPrice = casper.fetchText("#WC_CachedProductOnlyDisplay_div_4 > span.price");
            price_was = Price.format(totalPrice.replace(price,""),2);
        } else {
            price = casper.fetchText("#WC_CachedProductOnlyDisplay_div_4 > span.price");
        }
        price = Price.format(price,2);
        if (price) {
            json.price_now = price;
            json.status = true;
            json.stock = "in-stock";
            if(price_was) {
                json.price_was = Price.format(totalPrice.replace(price,""),2);
            }
        } else {
            json.status = true;
            json.stock = "out-of-stock";
        }
        json.title = casper.fetchText(" div.main-product-block > div.details-block > div.area-header.clearfix > h2:nth-child(2)");
        json.image = casper.getElementAttribute("#product-slider > li > a > img", "src");
        json.description = casper.getHTML("#details-panel");
        callback(json);
    }, function failed() {

        if(casper.getCurrentUrl() === "http://www.myer.com.au/") {
            json.status = true;
            json.stock = "notfound";
        } else {
            json.message = "Wait timeout for selector '.main-product-block'";
        }

        callback(json);
    }, timeout);
}

exports.search = function (casper, timeout, callback) {
    var json = {
        "status": false
    }
    casper.waitUntilVisible(".item-container", function success() {
        json.status = true;
        var notfoundSelect = "#content588 > div.banner-container.clearfix > div > div > p:nth-child(2) > strong:nth-child(2)";
        if (casper.exists(notfoundSelect) && casper.fetchText(notfoundSelect).indexOf("of 0 results") !== -1) {
            json.message = casper.fetchText(notfoundSelect);
            json.products = [];
        } else {
            var products = casper.evaluate(function () {
                var products = [];
                 $(".item-container .item-img > div > p >  a")
                     .each(function(index,item){
                         item = $(item);
                         item.remove("span.brand");
                         products.push({
                            "name":item.text(),
                             "url":item.attr("href")
                         });
                     });

                return products;
            });
            products.map(function(product){
                product.name = Offer.format(product.name);
                return product;
            });
            casper.log(JSON.stringify(products),"error");
            json.products = products;
        }
        callback(json);
    }, function failed() {
        json.message = "Wait timeout for selector '.item-container'";
        callback(json);
    }, timeout);
}