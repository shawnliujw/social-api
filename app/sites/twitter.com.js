/**
 * Created by Shawn Liu on 2014/12/3.
 */
var tools = require("../util/tools");
var site = "twitter.com";
exports.registration = function (casper, data, result, timeout, callback) {

}

exports.edit = function (casper, data, result, callback) {

}

exports.operation = function (casper, data, result, callback) {

}

function _followByFollowers(casper, result, timeout, callback) {
    casper.thenClick("#page-container > div.dashboard.dashboard-left.home-exp-tweetbox > div.DashboardProfileCard.module > div > div.DashboardProfileCard-stats > ul > li:nth-child(3) > a > span.DashboardProfileCard-statLabel.u-block");
    casper.then(function () {
        casper.waitUntilVisible(".GridTimeline-items", function () {
            var total = casper.fetchText("#page-container > div.ProfileCanopy.ProfileCanopy--withNav.ProfileCanopy--large > div > div.ProfileCanopy-navBar > div.AppContainer > div > div.Grid-cell.u-size2of3.u-lg-size3of4 > div > div > ul > li.ProfileNav-item.ProfileNav-item--followers.is-active > a > span.ProfileNav-value");
            total = parseInt(total);
            for (var i = 0; i < total; i++) {
                
            }

        }, function () {
            result.status = false;
            result.message = "Wait timeout when waiting all follower appear.";
            tools.getScreenShot(casper, data.site, "followByFollowersFailed");
            callback(result);
        }, timeout)
    })
}

function _followBySearch(casper, text, result, timeout, callback) {
    casper.waitUntilVisible("#search-query", function () {
        this.sendKeys("#search-query", text);
        casper.thenClick("#global-nav-search > span > button");
        casper.then(function () {
            casper.waitUntilVisible("#content-main-heading", function () {
                tools.getScreenShot(casper, site, "followBySearchSuccess");
                casper.click("ol.big-avatar-list li:nth-child(1) button.user-actions-follow-button");
            }, function () {
                result.status = false;
                result.message = "wait timeout for selector '#global-nav-search > span > button'";
                tools.getScreenShot(casper, site, "searchError");
            }, timeout);
        });
    }, function () {
        result.status = false;
        result.message = "wait timeout for selector '#search-query'";
        tools.getScreenShot(casper, "twitter.com", "searchError");
    }, timeout)
}

function _login(casper, data, result, timeout, callback) {
    site = data.site;
    casper.waitUntilVisible("#page-container", function () {
        if (casper.exists("signin-email")) {
            casper.waitUntilVisible("#frontpage-signup-form > button", function () {
                casper.sendKeys("#frontpage-signup-form > div:nth-child(1) > input", data.fullName || "");
                casper.sendKeys("#frontpage-signup-form > div:nth-child(2) > input", data.email);
            }, function timeout() {
                result.status = false;
                result.message = "Wait timeout for registration button";
                tools.getScreenShot(casper, data.site, "loginFailed");
                callback(result);
            }, timeout);
            casper.thenClick("#submit_button", function () {
                casper.wait(2000, function () {
                    if (casper.exists(".message-text") && casper.fetchText(".message-text") !== '') {
                        result.status = false;
                        result.message = "username or password wrong";
                        tools.getScreenShot(casper, data.site, "loginFailed");
                        callback(result);
                    } else {
                        tools.getScreenShot(casper, data.site, "loginSuccess");
                    }
                }, function () {
                    result.status = false;
                    result.message = "username or password wrong";
                    tools.getScreenShot(casper, data.site, "loginFailed");
                    callback(result);
                }, timeout);
            });
        }
    }, function () {
        result.status = false;
        result.message = "Wait timeout for selector '#page-container'";
        tools.getScreenShot(casper, data.site, "loginFailed");
    }, timeout);


}

function _validateRegistration(data) {
    var re = {
        status: true,
        "message": []
    }
    if (data.fullName) {
        re.status = false;
        re.message.push("FullName is required");
    }
    if (data.email) {
        re.status = false;
        re.message.push("Email is required");
    }
    if (data.password) {
        re.status = false;
        re.message.push("Password is required");
    }
    if (data.userName) {
        re.status = false;
        re.message.push("userName is required");
    }
    return re;
}