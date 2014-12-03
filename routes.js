var Promise = require("bluebird");
var logger = require("node-config-logger").getLogger("routes.js");
var dispatcher = require("./lib/dispatcher");
var scrapeCache = require("./lib/scrapeCache");
var retailerScripts = require("./lib/retailer");
var port = require("config").listener.port;
var monitor = require("./lib/systemMonitor");
module.exports = function(app, express) {

//	app.route('/static/*').get(function(req, res, next) {
//		res.sendfile('app' + req.path);
//	});
//
	app.route('/status').get(function(req, res, next) {
		output(res, dispatcher.getStatus());
	});

    app.route("/restart").post(function(req,res){
        logger.warn("Will restart express server.");
        res.json({
            "message":"Express server has been restarted(testing)."
        });
       // monitor.stopExpress(port);
    });
    app.route("/server/restart").post(function(req,res){
        logger.warn("Will restart express server.");
        res.json({
            "message":"Express server has been restarted."
        });
        monitor.stopExpress(port);
    });

	app.route('/retailers/:locale').get(function(req, res, next) {
		var locale = req.params.locale;
		if (!locale) {
			locale = "en_gb";
		}
		retailerScripts.all(locale).then(function(scripts) {
			output(res, scripts);
		}).catch(function(response) {
			output(res, response);
		});
	});

	app.route('/details/clear').post(function(req, res, next) {
		_clearCache(req, 'details').then(function(response) {
			output(res, response);
		}).catch(function(response) {
			output(res, response);
		});
	});

	app.route('/details').post(function(req, res, next) {
		_scrape(req).then(function(response) {
			output(res, response);
		}).catch(function(response) {
			output(res, response);
		});
	});

	app.route('/links').post(function(req, res, next) {
		_scrape(req).then(function(response) {
			output(res, response);
		}).catch(function(response) {
			output(res, response);
		});
	});

	app.route('/links/clear').post(function(req, res, next) {
		_clearCache(req, 'links').then(function(response) {
			output(res, response);
		}).catch(function(response) {
			output(res, response);
		});
	});
};

function _scrape(req) {
	return getPostData(req).then(function(response) {
		var url = req.url;
		if (response.status) {
			var postData = response.data;
			return dispatcher.scrape(postData.urls, postData.locale, postData.retailer, url.substr(1), postData.expiration);
		} else {
			return response;
		}
	});
}

function _clearCache(req, type) {
	return getPostData(req).then(function(response) {
		if (response.status) {
			var data = response.data;
			return scrapeCache.clear(type, data.urls, data.locale, data.retailer);
		} else {
			return response;
		}
	});
}

function getPostData(req) {
	return new Promise(function(resolve, reject) {
		var postData = "";
		req.setEncoding('utf8');
		req.addListener('data', function(postDataChunk) {
			postData += postDataChunk;
		});
		req.addListener('end', function() {
			try {
				postData = JSON.parse(postData);
				var message = getPostError(postData);
				if (message) {
					resolve({
						"status": false,
						"message": message
					});
				} else {
					resolve({
						"status": true,
						"data": postData
					});
				}
			} catch (e) {
				resolve({
					"status": false,
					"message": e.message
				});
			}
		});
	});
}

function getPostError(postData) {
	if (!postData.urls) {
		return "urls is required.";
	}
	if (!postData.locale) {
		return "locale is required.";
	}
	return null;
}

function output(res, data) {
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.end(JSON.stringify(data));
}
