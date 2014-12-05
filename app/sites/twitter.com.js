/**
 * Created by Shawn Liu on 2014/12/3.
 */
var tools = require("../util/tools");
var site = "twitter.com";
exports.registration = function (casper, data, result, timeout, callback) {

}

exports.edit = function (casper, data, result, timeout, callback) {

}

exports.operation = function (casper, data, result, timeout, callback) {
    var ops = data.operation;
    if (ops && ops.length > 0) {
        try {
            _login(casper, data, result, timeout, callback, function () {//login before do any operation
                casper.capture("after login.png");
                function _repeat(time) {
                    casper.wait(1000, function () {
                        _handleOperation(ops[time - 1], function finish() {
                            time--;
                            _repeat(time);
                        }, callback, result, timeout, casper)
                    });
                }

                _repeat(ops.length);
                result.status = true;
                result.message = "success to finish all operations";
            });

        } catch (e) {
            result.message = e;
        }

        callback(result);
    } else {
        result.status = false;
        result.message = "Didn't find any operations need to he handled";
    }

}

function _handleOperation(op, callback, errorCallback, result, timeout, casper) {
    switch (op.type) {
        case "followByFollowers" :
        {
            _followByFollowers(casper, result, timeout, callback);
            break;
        }
        case "followBySearch":
        {
            _followBySearch(casper, result, timeout, callback);
            break;
        }
        default :
        {
            result.status = false;
            result.message = "unkown operation '" + op.type + "'";
            errorCallback(result);
        }
    }

}


function _followByFollowers(casper, result, timeout, callback) {

    casper.thenClick("#page-container > div.dashboard.dashboard-left.home-exp-tweetbox > div.DashboardProfileCard.module > div > div.DashboardProfileCard-stats > ul > li:nth-child(3) > a > span.DashboardProfileCard-statLabel.u-block");
    casper.then(function () {
        casper.waitUntilVisible(".GridTimeline-items", function () {
            var total = casper.fetchText("#page-container > div.ProfileCanopy.ProfileCanopy--withNav.ProfileCanopy--large > div > div.ProfileCanopy-navBar > div.AppContainer > div > div.Grid-cell.u-size2of3.u-lg-size3of4 > div > div > ul > li.ProfileNav-item.ProfileNav-item--followers.is-active > a > span.ProfileNav-value");
            total = parseInt(total);
            function _follow(time) {
                casper.wait(tools.random(20, 90) * 1000, function () {
                    if (casper.exists(".GridTimeline-items .user-actions-follow-button:nth-child(" + time + ")")) {
                        casper.click(".GridTimeline-items .user-actions-follow-button:nth-child(" + time + ")");
                        time--;
                        if (time === 0) {
                            return;
                        } else {
                            _follow(time);
                        }
                    } else {
                        result.message = "follow button doesn't exist";
                        callback(result);
                    }

                });
            }

            _follow(total);
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
                //casper.click("ol.big-avatar-list li:nth-child(1) button.user-actions-follow-button");
                if (casper.exists("ol.big-avatar-list li:nth-child(1) button.user-actions-follow-button")) {
                    casper.click("ol.big-avatar-list li:nth-child(1) button.user-actions-follow-button");
                } else {
                    result.message = "follow button doesn't exist after search";
                    callback(result);
                }
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

function _login(casper, data, result, timeout, callback, executeCallback) {
    site = data.site;
    casper.capture("begin login.png");
    casper.waitUntilVisible("#frontpage-signup-form #signin-email", function () {
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
                    executeCallback();
                }
            }, function () {
                result.status = false;
                result.message = "username or password wrong";
                tools.getScreenShot(casper, data.site, "loginFailed");
                callback(result);
            }, timeout);
        });
    }, function () {
        capsper.log("can't find email input . assume no need login","error");
        tools.getScreenShot(casper, data.site, "noNeedLogin");
        executeCallback();// no need login anymore
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