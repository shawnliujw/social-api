var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function (casper, timeout, callback) {
    var json = {"status": false};
    casper.waitUntilVisible("body", function () {

        if (casper.exists(".fancybox-close")) {
            casper.thenClick(".fancybox-close");
        }

        casper.then(function () {

            casper.waitUntilVisible(".swiper-container img", function () {
                try {
                    var stock = this.fetchText(".verfuegbarkeit_os");
                    if (stock) {
//sofort lieferbar
                        if (stock.toLowerCase().indexOf("sofort lieferbar") !== -1) {
                            json.stock = "in-stock";
                        } else {
                            json.stock = "out-of-stock";
                        }
                        var price = this.getElementAttribute(".preisinfo_right .preismarke", "title");
                        price = Price.format(price, 2);
                        if (price) {
                            json.price_now = price;
                            json.status = true;
                        } else {
                            json.message = "price error";
                            json.status = false;
                        }
                        json.title = Offer.format(casper.fetchText(".headline_content h1"));
                        json.image = "http://onlineshop.real.de" + casper.getElementAttribute("#artikel_detail > div:nth-child(1) > div.span9 > div.artikelbild_carousel.swiper-container > div.swiper-wrapper > div.swiper-slide.swiper-slide-visible.swiper-slide-active > a > img", "src");
                        json.description = casper.evaluate(function () {
                            var node = document.querySelector("#tab_beschreibung > div > div");
                            return node ? node.innerHTML : "";
                        });
                    } else {
                        json.stock = "out-of-stock";
                        json.message = "stock error";
                    }

                } catch (e) {
                    json.status = false;
                    json.message = e.message;
                }
                callback(json);
            }, function timeout() {
                _handleError(json,casper,callback,".swiper-container img");
            }, timeout);


        })

    }, function onTimeout() {
        _handleError(json,casper,callback,"body");
    }, timeout);
};

function _handleError(json,casper,callback,selector) {
    var selector = '#artikel_detail .alert-error';
    if ((casper.exists(selector) && casper.fetchText(selector).indexOf("Es wurde kein") !== -1) || casper.getCurrentUrl().indexOf("www.real.de") !== -1) {
        json.status = true;
        json.stock = "notfound";
    } else {
        json.message = "Wait timeout for page selector '"+selector+"'";
    }
    callback(json);
}

exports.search = function (casper, timeout, callback) {
    var json = {"status": false};
    try {
        casper.waitUntilVisible("#content iframe", function () {

            casper.withFrame(0, function () {
                casper.scrollToBottom();
                var products = casper.evaluate(function () {
                    var nodes = document.querySelectorAll("#artikel_grid .artikel_grid_item h6.no_margin  a");
                    var temp = new Array();
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
            });


        }, function onTimeout() {
            json.message = "Wait timeout for selector '#content iframe'";
            callback(json);
        }, timeout);
    } catch (e) {
        json.message = e.message;
        callback(json);
    }
};