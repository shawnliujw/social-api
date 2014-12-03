var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function (casper, timeout, callback) {
    var json = {"status": false};
    casper.waitUntilVisible("#ctl00_ContentPlaceHolder1_lnkLivrabilite", function () {
        try {
            var stock = this.fetchText("#ctl00_ContentPlaceHolder1_pnlProduit #ctl00_ContentPlaceHolder1_lnkLivrabilite");
            if (stock) {
                stock = stock.toLowerCase();
                if (stock.indexOf("en stock") !== -1 || stock.indexOf("disponibilité estimée") !== -1) {
                    json.stock = "in-stock";
                } else {
                    json.stock = "out-of-stock";
                }
                var price = this.fetchText("#ctl00_ContentPlaceHolder1_pnlProduit  #ctl00_ContentPlaceHolder1_artPrix");
                price = Price.format(price, 2);
                if (price) {
                    json.price_now = price;
                    json.status = true;
                } else {
                    json.message = "price error";
                }

            } else {
                json.message = "stock error";
            }
            json.title = casper.fetchText(".faHeadCenter > h1");
            json.image = casper.getElementAttribute("#imgMainVisual", "src");
            json.description = casper.evaluate(function () {
                return "";
            });
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
    try {
        casper.waitUntilVisible("#ctl00_ContentPlaceHolder1_dt_Produits", function () {
            casper.scrollToBottom();
            var products = casper.evaluate(function () {
                var nodes = document.querySelectorAll("#ctl00_ContentPlaceHolder1_dt_Produits a.lien_theme");
                var temp = new Array();
                for (var i = 0; i < nodes.length; i++) {
                    temp.push({
                        "name": nodes[i].title,
                        "url": "http://joueclub.fr_fr/" + nodes[i].href
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