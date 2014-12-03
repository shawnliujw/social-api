/**
 * Created by liujianwei on 2014/9/26.
 */
var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
    var json = {
        "status":false
    };
    casper.waitUntilVisible("#widget_product_info_viewer",function success(){
      //  var stock = casper.fetchText("#subform > ol > li.available > span");
   //     if(stock) {

//            if(stock.indexOf("Available Now") !== -1) {
//                json.stock = "in-stock";
//            } else {
//                json.stock = "out-of-stock";
//            }
            var price = casper.fetchText(".right_column #widget_product_info_viewer  span.price");
            if(price && Price.format(price,2)) {
                json.status = true;
                json.stock = "in-stock"
                price = Price.format(price,2);
                json.price_now = price;
                price = casper.fetchText("#selection_price > p.price_was");
//                if(price && Price.format(price,2)) {
//                    json.price_was = price;
//                }
                var offer = casper.fetchText("#descAttributeValue_1");
                if(offer) {
                    json.offer = Offer.format(offer);
                }
            } else {
                json.status = true;
                json.stock = "out-of-stock";
               // json.message = "price error";
            }
//        } else {
//            json.message = "stock error";
//        }
        //body > div.main_container > div.content_container.single_column > div > div.content_main > div > div > div.details.hproduct > div > div > h1
        json.title = casper.fetchText("#widget_breadcrumb > ul > li:nth-child(5) > span");
        json.image = casper.getElementAttribute("#productMainImage","src");
        json.description = casper.evaluate(function(){
           var node = document.querySelector(".dijitTabContainerLeft-container .thisdescription");
           return node ? node.innerHTML : "";
        });
        callback(json);
    },function failed(){
        json.message = "Wait timeout for selector '.container_product_details_image_information'";
        callback(json);
    },timeout);
}

exports.search = function(casper, timeout, callback) {
    var json = {
        "status":false
    }
    casper.waitUntilVisible(".right_column_new",function success(){
        var shopAll = "#NERF_CategoryLanding_Top_Section_Espot_37004 > div > div > a > img";
        if(casper.exists(shopAll)) {
            casper.thenClick(shopAll,function(){
                _scrapeLinks(json,casper, timeout, callback)
            });
        } else {
            _scrapeLinks(json,casper, timeout, callback)
        }
    },function failed(){
        json.message = "Wait timeout for selector '.right_column_new'";
        callback(json);
    },timeout);
}

function _scrapeLinks(json,casper, timeout, callback) {
    casper.waitUntilVisible("#searchBasedNavigation_widget div.product_listing_container",function(){
        json.status = true;
        var notfoundSelect = ".left_menu_bar_hide_myaccount";
        if(casper.exists(notfoundSelect) && casper.fetchText(notfoundSelect).indexOf("were no items matching") !== -1) {
            json.message = casper.fetchText(notfoundSelect);
            json.products = [];
        } else {
            var products = casper.evaluate(function(){
                var baseUrl = "http://www.kmart.com.au";
                var tem = [];
                var nodes = document.querySelectorAll(".product_listing_container  .product_name a");
                if(nodes && nodes.length > 0) {
                    for(var i=0;i<nodes.length;i++) {
                        tem.push({
                            name:nodes[i].innerHTML,
                            url:baseUrl+nodes[i].href
                        });
                    }
                }
                return tem;
            });
            products.map(function(product){
                product.name = Offer.format(product.name);
                return product;
            });
            json.products = products;
        }
        callback(json);
    },function(){
        json.status = false;
        json.message = "Wait timeout for selector '.right_column_new'";
        callback(json);
    },timeout)


}