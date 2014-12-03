var Price = require("../../util/price");
var Offer = require("../../util/offer");
var Promise = require('bluebird');

exports.fetch = function (casper, timeout, callback) {
    var json = {"status": false};
    casper.waitUntilVisible("#overviewMain", function () {
        try {
            json.status = true;
            if (this.exists("#variants .outOfStock")) {
                json.stock = "out-of-stock";
            } else {
                json.stock = "in-stock";
            }
            var price = this.fetchText(".price");
            price = Price.format(price, 2);
            if (price) {
                json.price_now = price;
                price = this.fetchText(".wasPrice");
                if (price) {
                    json.price_was = Price.format(price, 2);
                }
                var offerText = this.fetchText(".wasNow");
                if (offerText) {
                    offerText = this.evaluate(function () {
                        var of = "";
                        var nodes = $(".wasNow");
                        if(nodes && nodes.length > 0) {
                            var str1 = $($(nodes[0]).find("li")[0]).text();
                            var str2 = $($(nodes[0]).find("li")[1]).text();
                            of = str1 + " " + str2;
                        }
                    });
                    json.offer = Offer.format(offerText);
                }
            } else {
                json.message = "price error";
            }
            json.image = this.getElementAttribute("#overview > div > div > div > div > img", "src");
            json.title = this.getElementAttribute("#overview > div > div > div > div > img", "alt");
            json.description = this.getHTML(".productSummary");
        } catch (e) {
            json.status = false;
            json.message = e.message;
        }
        // resolve(json);
        callback(json);
    }, function onTimeout() {
        if (casper.exists("img.error404")) {
            json.status = true;
            json.stock = "notfound";
        } else {
            json.message = "Wait timeout for page selector '#overviewMain'";
        }
        callback(json);
    }, timeout);
};

exports.search = function (casper, timeout, callback) {
    var json = {"status": false};
    try {
        casper.log("evaluating", 'info');
        var products = casper.evaluate(function () {
            var nodes = document.querySelectorAll("#ProductViewListGrid .pl_productName a.productName");
            var temp = [];
            console.log("boots.com::found " + nodes.length + " matching nodes");
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
        callback(json);

    } catch (e) {
        json.message = e.message;
        callback(json);
    }

    /*
     casper.waitUntilVisible(".searchResultsSummary", function() {

     var titles = casper.getElementsInfo("#right-col h1");
     for (var i = 0; i < titles.length; i++) {
     if (titles.text && title.text.toLowerCase().indexOf("no result") >= 0) {
     noResult = true;
     break;
     }
     }

     json.products = casper.evaluate(function() {
     var nodes = document.querySelectorAll("#product-tiles .productgroup .details a");
     var temp = [];
     for (var i = 0; i < nodes.length; i++) {
     temp.push({
     "name": nodes[i].innerText,
     "url": nodes[i].href
     });
     }
     return temp;
     });
     json.status = true;
     callback(json);

     }, function() {
     var noResult = false;
     try {
     var titles = casper.getElementsInfo("#right-col h1");
     for (var i = 0; i < titles.length; i++) {
     if (titles.text && title.text.toLowerCase().indexOf("no result") >= 0) {
     noResult = true;
     break;
     }
     }
     } catch(e) {
     // fall through
     }

     if (noResult) {
     json.products = [];
     json.status = true;
     } else {
     json.status = false;
     json.message = "no elements could be used to derive data from the page.";
     }

     callback(json);
     }, timeout);

     } catch (e) {
     json.message = e.message;
     callback(json);
     }
     */
};
