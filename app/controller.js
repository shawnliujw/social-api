/**
 * Created by Shawn Liu on 2014/12/3.
 */
'use strict'
var dispatcher = require("./lib/dispatcher");
var logger = require("log4js").getLogger("app/controller.js");
//// required data for registration
//var registrationAccounts = [
//    {
//        "username": "xxxx",
//        "password": "xxxxx",
//        "email": "xxx",
//        "password": "",
//        "xxx": "xxx"
//    },
//    {
//        "username": "xxxx",
//        "password": "xxxxx",
//        "email": "xxx",
//        "password": "",
//        "xxx": "xxx"
//    }
//];
//
exports.registration = function (req, res) {
    var site = req.params.site;
    var body = req.body ? req.body.accounts : null;
    if (body) {
        body = body.map(function (ac) {
            ac.site = site;
            return ac;
        });
        dispatcher.process(site, body, "registration")
            .then(function (result) {
                res.json(result);
            })
            .catch(function (err) {
                res.json({
                    "status": false,
                    "message": err.message || err
                });
            })
    } else {
        res.statusCode = 400;
        res.json({
            "status": false,
            "message": "need account details to move on"
        });
    }
}


//// required data for account tasks
//var operatedAccounts = {
//    "account": [
//        {
//            "usrname": "xxx",
//            "password": ""
//        }
//    ],
//    "operation": [{
//        "type": "followByFollowers",// followBySearch,tweet,retweet,favourite tweet
//        "condition": ""// here should be the search item if it's  needed in the searchType
//    }]
//}
exports.operate = function (req, res) {
    var site = req.params.site;
    var body = req.body;
    if (body && body.accounts && body.operation) {
        var accounts = body.accounts.map(function (ac) {
            ac.site = site;
            ac.operation = body.operation;
            return ac;
        });
        //res.json({
        //    "status": true,
        //    "message": "your request are being proceed"
        //});
        dispatcher.process(site, accounts, "operation")
            .then(function (result) {
                res.json(result);
            })
            .catch(function (err) {
                logger.error(err);
            });

    } else {
        res.statusCode = 400;
        res.json({
            "status": false,
            "message": "Both account details and operation."
        });
    }
}

//// required data for proxy update
//var proxies = [
//    {
//        "ip": "xxx",
//        "username": "",
//        "password": ""
//    },
//    {
//        "ip": "xxx",
//        "username": "",
//        "password": ""
//    }
//]
exports.updateProxy = function (req, res) {

}

exports.scrape = function (req, res) {
    var site = req.params.site;
    var type = req.params.type;
    var accounts = req.body;//[{"username":"xxx","password":""},{}]
}

function _scrape(req) {
}
