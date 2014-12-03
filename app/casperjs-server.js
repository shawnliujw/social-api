var system = require("system");
var Logger = require('./util/casperLogger');
var logger = new Logger(system.env.CASPER_LOG_FILE || './casper.log');

var casper = require('casper').create({
	viewportSize: {width: 1366, height: 768},
	pageSettings: {
		userAgent: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.149 Safari/537.36",
		loadImages: false,
		loadPlugins: false,
		resourceTimeout: 10000
	},
	verbose: true,
	logLevel: system.env.CASPER_LOG_LEVEL ? system.env.CASPER_LOG_LEVEL.toLowerCase() : 'debug'
});

var config = JSON.parse(system.args[system.args.length - 1]);
var server = require('webserver').create();
//var casper = require('casper').create();
//casper.userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.149 Safari/537.36');
phantom.addCookie({
	'name': 'referencedPos',
	'value': 1077,
	'domain': 'www.lagranderecre.fr'
});
casper.start();
var timeout = 5000;
var status = server.listen(config.port, function(request, response) {
	casper.on('remote.message', function(msg) {
		logger.info('<REMOTE MESSAGE> ' + msg);
	});
	casper.then(function() {
		//var method = request.method;
		if (request.url === '/scrape') {
			var postData = request.post;
			postData = this.evaluate(function(s) {
				return JSON.parse(s);
			}, postData);

			if (postData) {
				_process(postData, response);
			} else {
				_outputJSON({
					"status": false,
					"message": "There is no urls to be updated."
				}, response);
			}
		} else if (request.url === '/exit') {
			logger.info("Casper server suicide");
			_output("server is stopping.", response);
			server.close();
			casper.exit();
		} else {
			logger.info("Other url received: " + request.url);
			_output("server is running.", response);
		}
	});
	casper.on("exit", function(code) {
		logger.info("Casper server exit: " + code);
		//casper.log("Casper server exit:" + msg, "error");
	});
	casper.on("error", function(msg) {
		logger.error("Casper server error: ", msg);
		//casper.log(msg, "error");
	});

	casper.on("log", function(msg) {
		if (msg) {
			logger.info(msg.message);
		}
	});

	casper.on("resource.error", function(resourceError) {
		//only write log into casper log file , for the log that need to send back to node process. see below
		logger.error("Resource error:" + JSON.stringify(resourceError));
		
		// here change the log lever of resource.error from error to debug
		// due many these log are occoure like 'Operation canceled' , etc,  normally these kind of error won't cause two terrible issue
		// so in the production we don't want them to be inserted into log file . 
		// in dev eviroment we will use level debug ,there information will come out.
		casper.log("Resource error:" + JSON.stringify(resourceError), "debug");
		                                                                       
	});
	casper.run(function() {
		logger.info("Casper listening on port " + config.port);
		//casper.log("Casper listening on port " + config.port, "info");
	});
});

if (!status) {
	logger.info("Failed to listen on port " + config.port);
	casper.exit(1);
}

function details(script, timeout, json, products) {
	script.fetch(casper, timeout, function(productDetails) {
		if (productDetails) {
			if (productDetails.message === 'price error') {
				productDetails.status = false;
				productDetails.message = "Price selector not found..";
			} else if (productDetails.message === 'stock error') {
				productDetails.status = false;
				productDetails.message = "Stock selector not found..";
			}
			productDetails.url = json.url;
			productDetails.updateTime = json.updateTime;
			productDetails.script = json.script;
			productDetails.timestamp = (new Date()).getTime();
			if (json.actualURL) {
				productDetails.actualURL = json.actualURL;
			}
			logger.info("SCRAPED result: " + JSON.stringify(productDetails));
            //casper.log("SCRAPED Details:" + JSON.stringify(productDetails),"debug");
			products.push(productDetails);
		} else {
			json.message = "Selector not found, maybe invalid product details page or need new selector.";
			//assume the watiUntiVisible is valid for each retailer
			// just in case this is not product page ,will treat it as out-of-stock
			if (url.indexOf("amazon") === -1) {
				json.status = true;
			}
			products.push(json);
		}
	});
}

function links(script, timeout, json, products) {
	script.search(casper, timeout, function (links) {
		//json.status = (links.products && links.products.length > 0);
		json.status = links.status;
		json.links = links.products || [];
		json.message = links.message;
		logger.info("SCRAPED Links: " + JSON.stringify(links));
//		casper.log("SCRAPED Links:" + JSON.stringify(links), "debug");
		products.push(json);
	});
}

function _process(params, res) {
	var products = [];
	var outputJson = {
		"status": false,
		"message": ""
	};
	casper.eachThen(params, function(job) {
		var url = job.data.url;
		var method = job.data.method;
		var retailerFile = job.data.retailerFile;
		var json = {
			status: false,
			url: url,
			updateTime: new Date().toUTCString(),
			script: retailerFile.split("/").slice(-1).join("/")
		};
		var script = require(retailerFile);

		if (script) {

			// allow script to make changes to the url prior to opening
			if (script.redirect) {
				url = script.redirect(url);
				json.actualURL = url;
			}
			
			this.thenOpen(url, function onResponse(response) {
				json.code = response.status;
				switch (response.status) {
					case 200 :
						try {
							if (method === "details") {
								// Keep this check until all retailer scripts are migrated to promises
								// if (retailerFile.indexOf('amazon.co.uk') > -1 || retailerFile.indexOf('argos.co.uk') > -1 || retailerFile.indexOf('boots.com') > -1 || retailerFile.indexOf('direct.asda.com') > -1) {
								// 	script.fetch(casper, timeout)
								// 	.then(function(productDetails) {
								// 		if (productDetails) {
								// 			if (productDetails.message === 'price error') {
								// 				productDetails.status = false;
								// 				productDetails.message = "Price selector not found..";
								// 			} else if (productDetails.message === 'stock error') {
								// 				productDetails.status = false;
								// 				productDetails.message = "Stock selector not found..";
								// 			}
								// 			productDetails.url = json.url;
								// 			productDetails.updateTime = json.updateTime;
								// 			products.push(productDetails);
								// 		} else {
								// 			json.message = "Selector not found,maybe invalid product details page or need new selector.";
								// 			//assume the watiUntiVisible is valid for each retailer
								// 			// just in case this is not product page ,will treat it as out-of-stock
								// 			if (url.indexOf("amazon") === -1) {
								// 				json.status = true;
								// 			}
								// 			products.push(json);
								// 		}
								// 	})
								// 	.error(function (msg) {
								// 		// Reject handler
								// 	});
								// } else {

								details(script, timeout, json, products);

							} else if (method === 'links') {
								// Keep this check until all retailer scripts are migrated to promises
								// if (retailerFile.indexOf('amazon.co.uk') > -1 || retailerFile.indexOf('argos.co.uk') > -1 || retailerFile.indexOf('boots.com') > -1 || retailerFile.indexOf('direct.asda.com') > -1) {
								// 	script.search(casper, timeout)
								// 	.then(function (links) {
								// 		if (links.products) {
								// 			json.status = true;
								// 			json.links = links.products;
								// 		} else {
								// 			json.message = "Waittime out.";
								// 		}
								// 		products.push(json);
								// 	})
								// 	.error(function (msg) {
								// 		// Reject handler
								// 	});
								// } else {
								links(script, timeout, json, products);

							} else {
								json.message = "unknown method " + method;
								products.push(json);
							}

						} catch (e) {
							json.message = e.message;
							products.push(json);
						}
						break;
					case 404:
						json.status = true;
						json.stock = "notfound";
						products.push(json);
						break;
					case 410:
						json.status = true;
						json.stock = "notfound";
						products.push(json);
						break;
					default:
						json.status = false;
						json.message = "Failed to access retailer site " + url + " - "
								+ (response ? JSON.stringify(response) : "");
						products.push(json);
				}

			}, function onTimeout() {
				json.message = "Timeout opening " + url;
				products.push(json);
			}, timeout);

		} else {
			json.message = retailerFile + " not found";
			products.push(json);
		}

	});

	casper.then(function() {
		logger.info("request complete: responses received:" + products.length + " - responses expected:" + params.length);
		if (products.length === params.length) {
			outputJson.status = true;
			outputJson.results = products;
		} else {
			outputJson.status = false;
			outputJson.message = "responses received:" + products.length + " - responses expected:" + params.length;
			outputJson.params = params;
			outputJson.results = products;
		}
		_outputJSON(outputJson, res);
	});

	casper.on("error", function(msg, backtrace) {
		outputJson.message = msg;
		outputJson.status = false;
		_outputJSON(outputJson, res);
	});
}

function _outputJSON(data, response) {
	_output(JSON.stringify(data), response, 'application/json');
}

function _output(s, response, contentType) {
	response.writeHead(200, {
		'Content-Type': contentType || 'text/plain'
//		'Content-Length': s.length
	});
	response.write(s);
	response.close();
}
