
var logger = require('log4js').getLogger("retailer.js");
var Path = require("path");
var urlParser = require("url");
var fs = require("fs");
var Promise = require("bluebird");
var async = require("async");

var validSubdomain = {
	"en_gb": {
		"groceries.asda.com": true,
		"direct.asda.com": true
	}
}

/**
 * get retailer js file according to a product URL.
 * @param {type} locale
 * @param {type} productURL
 * @returns {String} path to retailer script
 */
function getScript(productURL, locale, retailer) {
	var path = [__dirname, "sites"];
	var url = "";
	try {
		url = productURL ? urlParser.parse(productURL) : null;
		if (url) {
			var domain = retailer || url.hostname.toLowerCase();
			var comps = domain.split(".");
			var tld = comps[comps.length - 1];
			var nc = 2; // number of useful domain components
			switch (tld) {
				case "uk" :
					if (!locale) locale = "en_gb";
					nc = 3;
					break;

				case "us" :
				case "com" :
					if (!locale) locale = "en_us";
					break;

				case "au" :
					if (!locale) locale = "en_au";
					nc = 3;
					break;

				case "de" :
					if (!locale) locale = "de_de";
					break;

				case "fr" :
					if (!locale) locale = "fr_fr";
					break;

				case "es" :
					if (!locale) locale = "es_es";
					break;

				default:
					if (!locale) locale = tld;
			}

			if (!retailer) {
				// some retailer sub domains are actually meaningful
				domain = comps.slice(-(nc + 1)).join(".");
				if (!validSubdomain[locale] || !validSubdomain[locale][domain]) {
					domain = comps.slice(-nc).join(".");
				}
			}

			path.push(locale);

			var section = url.pathname.split("/")[1];
			switch (domain) {
				case "tesco.com" :
					section = (section === "direct") ? section : "groceries";
					section = section + "." + domain;
					path.push.apply(path, [domain, (section + ".js")]);
					break;

				case "sainsburys.co.uk" :
					// todo more precise comparison based on parsed url path
					if (productURL.indexOf("groceries") !== -1 || productURL.indexOf("webapp/wcs/stores/servlet/SearchDisplayView") !== -1) {
						section = "groceries." + domain;
					}
					path.push.apply(path, (section.match("groceries")) ? [domain, (section + ".js")] : [domain + ".js"]);
					break;

				default:
					path.push(domain + ".js");
			}

			return new Promise(function(resolve, reject) {
				var filePath = Path.join.apply(null, path);
				fs.exists(filePath, function(exists) {
					if (exists) {
						//logger.debug("loaded retailer script " + filePath);
						resolve({
							url: productURL,
							retailerFile: filePath,
							status: true
						});

					} else {
						// disable reject, so that the promise can go on even there exist some retailer scripts not implemented.
						logger.error("Retailer script " + filePath + " not found.  retailer " + domain + " may not be supported");
						resolve({
							status: false,
							url: productURL,
							message: "Retailer script " + filePath + " not found.  retailer " + domain + " may not be supported"
						});
					}
				});
			});

		} else {
			logger.error("Product URL could not be parsed: " + productURL);
			return Promise.resolve({
				status: false,
				url: productURL,
				message: "Product URL could not be parsed: " + productURL
			});
		}
	} catch (e) {
		logger.error("Failure while getting script for " + productURL + " : " + e);
		path = null;
		return Promise.resolve({
			status: false,
			url: productURL,
			message: e
		});
	}

}

/**
 *
 * @param urls      array of urls to scrape
 * @param locale    locale
 * @param retailer  retailer id (optional) in case url,locale is not sufficient to determine the script
 * @returns {*}
 */
exports.get = function(urls, locale, retailer) {
	if (Array.isArray(urls)) {
		return Promise.map(urls, function(url) {
			return getScript(url, locale, retailer);
		}).then(function(scripts) {
			return scripts.reduce(function(arr, el) {
				if (el.status) {
					arr.push({
						url: el.url,
						retailerFile: el.retailerFile
					});
				}
				return arr;
			}, []);
		});
	} else {
		return getScript(urls, locale, retailer);
	}
};

//
//var url1 = "http://www.sainsburys.co.uk/webapp/wcs/stores/servlet/SearchDisplayView?catalogId=10122&langId=44&storeId=10151&krypto=K0N4jPPPQUi4js1ccgOZAVXXDNVg%2BPBsWfevV8ty%2B5WDl%2BHu35OrCvN9YPvsGEBOivA%2FEFf%2FVfoH%0AHJvN0pIBn2EwdnnXOWmbb%2Fva7tMlwk4ANqcBojElFZh82ZlB2CLKfxVVgGbiBAAKe3CiMD6DdsWZ%0Ad3KrEqoL19I40ptj9RlD1X6O5hY4u3VmKndW7kiAPCPAIQUHsAv8wYMzX0khVpNom7nmeUgwcPIi%0ArUksKF4I7nUU7gl22mhe2JFs4Rxa#langId=44&storeId=10151&catalogId=10122&categoryId=&parent_category_rn=&top_category=&pageSize=30&orderBy=RELEVANCE&searchTerm=oil&beginIndex=0&categoryFacetId1=";
//var url2 = "http://www.sainsburys.co.uk/sol/global_search/global_result.jsp?bmForm=global_search&GLOBAL_DATA._search_term1=food&GLOBAL_DATA._searchType=0&bmUID=1406514161375";
//getScript(url1, "en_gb").then(function(data) {
//	console.log(data);
//})

exports.all = function(locale) {
	return new Promise(function(resolve, reject) {
		var dir = __dirname + '/sites/' + locale + '/';
		var scripts = [];
		fs.readdir(dir, function(err, files) {
			if (err) {
				return reject(err);
			}
			async.each(files, function(file, callback) {
				fs.stat(dir + file, function(err, stats) {
					scripts.push(file);
					callback();
				});
			}, function(err) {
				if (err) {
					return reject(err);
				}
				resolve(scripts);
			});
		});
	});
};
