var baseUrl = "http://www.hasbro.com";
exports.fetch = function (casper, timeout, callback) {
    var json = {
        "status": false
    };
    casper.waitUntilVisible("body ", function () {
        try {

            var itemCode = casper.fetchText(" .itemlabel");
            if (itemCode) {
                itemCode = itemCode.indexOf(":") !== -1 ? itemCode.split(":")[1] : itemCode;
                itemCode = itemCode.trim();
            } else {
                itemCode = casper.getElementAttribute(".product_info .wtb_button", "name");//for Rebelle
            }
            var name = "";
            if (casper.exists(".product_info .title")) {
                name = casper.fetchText(".product_info .title");
            } else {
                name = casper.fetchText(" .title");
            }
            var image = casper.getElementAttribute("#main_img", "src");
            if (!image) {
                image = casper.getElementAttribute("section.gallery_mainimg img", "src");
            }
            var ages = casper.fetchText(".agedisplay");
            if (ages) {
                //ages = ages.replace("Ages:","").trim();
                ages = ages.indexOf(":") !== -1 ? ages.split(":")[1].trim() : ages.trim();
            }
            var description = "";
            if (casper.exists(".description-text")) {
                description = casper.getHTML(".description-text");
            } else if (casper.exists(".pdp_description")) {
                description = casper.getHTML(".pdp_description");
            }
            json.status = !(!name || !image);
            json.product = {
                "productName": name.trim(),
                "url": casper.getCurrentUrl(),
                "itemCode": itemCode.trim(),
                "imageUrl": baseUrl + image,
                "ages": ages,
                "description": description
            };
        } catch (e) {
            json.status = false;
            json.message = e.message || e;
        }
        callback(json);
    }, function ontimeout() {
        json.message = "Wait timeout for page selector 'body '";
        callback(json);
    }, timeout);
};

exports.search = function (casper, timeout, callback) {
    var json = {"status": false};
    casper.then(function () {
        casper.waitUntilVisible(".grid ", function () {
            if (casper.exists(" .grid  .item_img")) {
                getUrls(casper, json, timeout, callback);
            } else if (casper.exists(".grid  a.title")) {
                getUrls1(casper, json, timeout, callback);
            } else {
                getUrls1(casper, json, timeout, callback);
            }
        }, function ontimeout() {
            json.message = "Wait timeout for page selector '.grid'";
            callback(json);
        }, timeout);
    });
};
//for Nerf,Play-Doh,My Little Pony,Transformers,Littlest Pet Shop
function getUrls(casper, json, timeout, callback) {
    var products = [];
    fetchUrl();
    function fetchUrl() {
        casper.waitUntilVisible(".grid  .item_img ", function () {
            var urls = casper.getElementsAttribute(".grid  .item_img", "href");
            var names = casper.getElementsAttribute(" .grid  .item_img  img", "alt");
            for (var i = 0; i < urls.length; i++) {
                products.push({
                    "name": names[i],
                    "url": baseUrl + urls[i]
                });
            }
            if (casper.exists(" .pagination .next")) {
                casper.thenClick(".pagination .next", function () {
                    fetchUrl();
                });
            } else {
                json.products = products;
                json.status = (products && products.length > 0);
                callback(json);
            }
        }, function ontimeout() {
            json.message = "Wait timeout for page selector '.grid  .item_img'";
            callback(json);
        }, timeout);

    }

}
//for My Little Pony Equestria Girls,Nerf Rebelle,Monopoly
function getUrls1(casper, json, timeout, callback) {
    var products = [];
    fetchUrl();
    function fetchUrl() {

        casper.waitUntilVisible(".grid  a.title", function () {
            var products1 = casper.evaluate(function () {
                var nodes = document.querySelectorAll(".grid .title");
                var array = [];
                nodes.forEach(function (node) {
                    array.push({
                        "name": node.innerHTML,
                        "url": baseUrl + node.href
                    });
                });
                return array;
            });
            if (!products1) {
                var hrefs = this.getElementsAttribute(".grid .title", "href");
                var names = this.getElementsAttribute(".grid_item > a img", "alt");

                for (var i = 0; i < hrefs.length; i++) {
                    products.push({
                        "name": names[i],
                        "url": baseUrl + hrefs[i]
                    });
                }
            } else {
                products = products.concat(products1);
            }
            if (casper.exists(" .pagination .next")) {
                casper.thenClick(".pagination .next", function () {
                    fetchUrl();
                });
            } else {
                json.products = products;
                json.status = (products && products.length > 0);
                callback(json);
            }
        }, function ontimeout() {
            json.message = "Wait timeout for page selector '.grid  a.title'";
            callback(json);
        }, timeout);


    }

}