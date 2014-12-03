exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#main .product-image", function() {
		var productArray = casper.evaluate(function() {
			var products = new Array();
			$('#products-holder .product-holder').each(function(index, item) {
				var name = $(item).find(".product-title").text();
				var itemCode = $(item).find(".product-retailer-link").attr("name");
				if (name && itemCode) {
					var pro = {
						"productName": name.trim(),
						"url": "http://www.nerfelite.co.uk/category/n-strike-elite",
						"imageUrl":$(item).find(".product-image img").attr("src"),
						"itemCode": itemCode.trim(),
						"description":$(item).find(".product-description").html()
					};
					//__utils__.echo(JSON.stringify(pro));
					products.push(pro);
				}
			});
			return products;
		});
		json.status = true;
		json.products = productArray;
		callback(json);
	},function ontimeout(){
		json.message = "Waittime out for selector '#main .product-image'";
		callback(json);
	}, timeout);
};