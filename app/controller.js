/**
 * Created by Shawn Liu on 2014/12/3.
 */
'use strict'
var dispatcher = require("./lib/dispatcher");

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
//    "operation": {
//        "type": "followByName",// followBySearch,tweet,retweet,favourite tweet,scrapeTweets,scrapeAccounts
//        "condition": ""// here should be the search item if it's  needed in the searchType
//    }
//}
exports.operate = function (req, res) {
    var site = req.params.site;
    var body = req.body;
    if (body && body.accounts && body.operation) {
        body = body.map(function (ac) {
            ac.site = site;
            ac.operation = body.operation;
            return ac;
        });
        dispatcher.process(site, body, "operation")
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

function _scrape(req) {
}
