/**
 * Created by Shawn Liu on 2014/12/3.
 */
'use strict'
var dispatcher = require("./lib/dispatcher");
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
                })
            })
    } else {
        res.json({
            "status": false,
            "message": "need account details to move on"
        });
    }
}

exports.edit = function (req, res) {

}

function _scrape(req) {
}
