/**
 * Created by liujianwei on 2014/9/26.
 */
var Price = require("../../util/price");
var Offer = require("../../util/offer");
exports.fetch = function(casper, timeout, callback) {
    var json = {
        "status":false
    };
    casper.waitUntilVisible(".product_details",function success(){
        var stock = casper.fetchText("#subform > ol > li.available > span");
        if(stock) {
            json.status = true;
            if(stock.indexOf("Available Now") !== -1) {
                json.stock = "in-stock";
            } else {
                json.stock = "out-of-stock";
            }
            var price = casper.fetchText("#selection_price > p.price_now > span.price_format");
            if(price && Price.format(price,2)) {
                price = Price.format(price,2);
                json.price_now = price;
                price = casper.fetchText("#selection_price > p.price_was");
                if(price && Price.format(price,2)) {
                    json.price_was = price;
                }
                var offer = casper.fetchText("#selection_price > p.price_save");
                if(offer) {
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
        json.title = casper.fetchText("body > div.main_container > div.content_container.single_column > div > div.content_main > div > div > div.details.hproduct > div > div > h1");
        json.image = casper.getElementAttribute("#flyboximage","src");
        callback(json);
    },function failed(){
        json.message = "Wait timeout for selector '.product_details'";
        callback(json);
    },timeout);
}

exports.search = function(casper, timeout, callback) {
    var json = {
        "status":false
    }
    casper.waitUntilVisible(".advanced_search_container",function success(){
        json.status = true;
        var notfoundSelect = "body > div.main_container > div.content_container > div.content_section.section_2 > div.content_main > div > div > div > div.search_heading_container > div > div > div";
        if(casper.exists(notfoundSelect) && casper.fetchText(notfoundSelect).indexOf(" couldn't locate") !== -1) {
            json.message = casper.fetchText(notfoundSelect);
            json.products = [];
        } else {
            json.products = casper.evaluate(function(){
                var products = [];
                var nodes = document.querySelectorAll("div.products .item .element_wrapper .item_name a");
                if(nodes && nodes.length > 0) {
                    for(var i=0;i<nodes.length;i++) {
                        products.push({
                            name:nodes[i].innerHTML,
                            url:nodes[i].href
                        });
                    }
                }
                return products;
            });
        }
        callback(json);
    },function failed(){
        json.message = "Wait timeout for selector '.advanced_search_container'";
        callback(json);
    },timeout);
}