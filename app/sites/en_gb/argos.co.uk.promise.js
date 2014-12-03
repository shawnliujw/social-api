var Price = require("../../util/price");
var Offer = require("../../util/offer");
var _super = require("../../scriptbase");

var _scrapeProductDetails = function(casper) {
	var response = {
		price_now: Price.format(casper.fetchText("#pdpDetails #pdpProductInformation #pdpPricing .actualprice .price"), 2)
	};
	if (response.price_now) {
		response.message = "OK";
		response.status = true;
		response.stock = 'in-stock';
		response.price_was =
			Price.format(casper.fetchText("#pdpDetails #pdpProductInformation #pdpPricing .wasprice"), 2);
		response.offer =
			Offer.format(casper.fetchText("#pdpDetails #pdpProductInformation #pdpPricing .saving"));
	} else {
		response.message = "price error";
		response.status = false;
	}
	return response;
};

exports.fetch = function(casper, timeout) {
	return _super.details(casper, "#pdpDetails #pdpProductInformation #pdpPricing", _scrapeProductDetails, timeout);
}

exports.search = function(casper, timeout) {
	return _super.links(casper, null, ".product .title a", timeout);
};