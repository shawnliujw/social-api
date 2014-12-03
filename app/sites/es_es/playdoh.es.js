var baseUrl = "http://www.playdoh.es";
exports.fetch = function(casper, timeout, callback) {
	var json = {
		"status": false
	};
	casper.waitUntilVisible("#detalle ", function() {
		var itemCode = casper.fetchText(".itemlabel b");
		var name = casper.fetchText(" .pageTitle");
		var image = baseUrl + casper.getElementAttribute("#main_img", "src");
		var ages = casper.fetchText(".agedisplay  b");
		var description = casper.getHTML("#product-detail");
		if (itemCode) {
			var pro = {
				"productName": name.trim(),
				"url": casper.getCurrentUrl(),
				"itemCode": itemCode.trim(),
				"imageUrl": image,
				"ages": ages,
				"description": description
			};
			json.status = true;
			json.product = pro;
			callback(json);
		}
	}, function ontimeout() {
		json.message = "Wait timeout for page selector";
		callback(json);
	}, timeout);
};

exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("#PaginationTop_pageUpdater #PaginationTop_lnkItems48", function() {
		var count = 0;
		var products = [];
		if (casper.exists("#PaginationTop_lnkItems48")) {
			casper.thenClick("#PaginationTop_lnkItems48", function() {
				casper.waitForSelectorTextChange('.pagination .active', function() {
					fetchUrl();
				});
			});
		} else {
			fetchUrl();
		}
		function fetchUrl() {
			casper.waitUntilVisible("#products-grid .item_img ", function() {
				var urls = casper.getElementsAttribute(".item_img", "href");
				var names = casper.getElementsAttribute(".item_img > img", "alt");
				for (var i = 0; i < urls.length; i++) {
					products.push({
						"name": names[i],
						"url": baseUrl + urls[i]
					});
				}
				if (casper.exists("#PaginationTop_next") && count === 0) {
					casper.thenClick("#PaginationTop_next", function() {
						count++;
						fetchUrl();
					});
				} else {
					json.products = products;
					json.status = (products && products.length > 0);
					callback(json);
				}
			}, function ontimeout() {
				json.message = "Wait timeout for page selector ' #products-grid .item_img'";
				callback(json);
			}, timeout);

		}
	}, function() {
		json.message = "Wait timeout for page selector '#PaginationTop_pageUpdater #PaginationTop_lnkItems48'";
		callback(json);
	}, timeout);

};