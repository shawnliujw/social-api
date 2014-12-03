var Price = require("../../util/price");
var Offer = require("../../util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#buy-interior", function() {
		try {
			var stock = this.fetchText("#buy-interior .in-stock h4");
			if (stock) {
				json.status = true;
				if (stock.indexOf("Disponible") !== -1) {
					json.stock = "in-stock";
				}
                var price = this.fetchText("#buy-interior #price .price");
                var priceNow = this.fetchText("#price > dl > dd.ours");
                var priceWas = this.fetchText("#price > dl > dd.list");
                if(priceNow && Price.format(priceNow,2)) {
                    json.price_now = Price.format(priceNow,2);
                    json.price_was = Price.format(priceWas,2);
                } else if(price){
                    price = Price.format(price, 2);
                    json.price_now = price;
                } else {
                    json.message = "price error";
                }
			} else {
				json.message = "stock error";
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {

        if(casper.getCurrentUrl().indexOf("/home/index.jsp?") !== -1) {
            json.stock = "notfound";
            json.status = true;
        } else {
            json.message = "Wait timeout for page selector '#buy-interior'";
        }

		callback(json);
	}, timeout);
};