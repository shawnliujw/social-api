/**
 * Created by Shawn Liu on 2014/12/3.
 */
var tools = require("../util/tools");
var site = "twitter.com";
exports.registration = function (casper, result, timeout, callback) {
    var data = result.postData;
    if (data) {
        casper.then(function () {
            _registration(casper, data, result, timeout, callback);
        });

        casper.then(function () {

        });


    } else {
        result.status = false;
        result.message = "missed required fields";
    }
}


function _registration(casper, formData, result, timeout, callback) {

    casper.wait(tools.random(20, 90), function () {

    });
}
exports.edit = function (casper, result, timeout, callback) {

}

exports.operation = function (casper, result, timeout, callback) {
    var data = result.postData;
    var ops = data.operation;
    if (ops && ops.length > 0) {
        try {
            _login(casper, data, result, timeout, callback, function () {//login before do any operation
                function _repeat(time) {
                    if (time <= 0) {
                        return;
                    } else {
                        casper.wait(1000, function () {
                            _handleOperation(ops[time - 1], data.email, function finish() {
                                time--;
                                _repeat(time);
                            }, callback, result, timeout, casper)
                        });
                    }
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

function _handleOperation(op, email, callback, errorCallback, result, timeout, casper) {
    switch (op.type) {
        case "followByFollowers" :
        {
            _followByFollowers(casper, email, result, timeout, callback);
            break;
        }
        case "followBySearch":
        {
            _followBySearch(casper, email, result, timeout, callback);
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


function _followByFollowers(casper, email, result, timeout, callback) {
    var followButtonS = "#page-container > div.dashboard.dashboard-left.home-exp-tweetbox > div.DashboardProfileCard.module > div > div.DashboardProfileCard-stats > ul > li:nth-child(3) > a > span.DashboardProfileCard-statLabel.u-block";
    casper.waitUntilVisible(followButtonS, function () {
        casper.click(followButtonS);
        casper.then(function () {
            tools.getScreenShot(casper, site, email, "beginToFollow");
            casper.waitUntilVisible(".GridTimeline-items", function () {
                var total = this.evaluate(function () {
                    var nodes = document.querySelectorAll(".GridTimeline-items .Icon--follow");
                    return nodes ? nodes.length : 0;
                })

                function _follow(time) {
                    casper.wait(timeout, function () {

                        tools.getScreenShot(casper, site, email, "followTimes" + time);
                        casper.wait(tools.random(20, 90) * 1000, function () {
                            time = parseInt(time);
                            //casper.click(".GridTimeline-items .user-actions-follow-button .Icon--follow");
                            //result.buttonLength = this.evaluate(function (index) {
                            //    var buttons = document.querySelectorAll(".GridTimeline-items .user-actions-follow-button .following-text");
                            //    buttons[0].click();
                            //    return buttons ? buttons.length : 0;
                            //}, time);
                            //casper.wait(2000, function () {
                            //    casper.capture("AfterClickFollow" + time + ".png");
                            //    time--;
                            //    if (time === 0) {
                            //        return;
                            //    } else {
                            //        _follow(time);
                            //    }
                            //});
                            if (casper.exists(".GridTimeline-items .Icon--follow:nth-child(" + time + ")")) {
                                casper.click(".GridTimeline-items .Icon--follow:nth-child(" + time + ")");
                                time--;
                                if (time === 0) {
                                    return;
                                } else {
                                    _follow(time);
                                }
                            } else {
                                result.message = "follow button doesn't exist";
                                result.status = false;
                                tools.getScreenShot(casper, site, email, "followButtonNotfound");
                                callback(result);
                            }

                        });

                    }, function () {
                        result.message = "wait timeout for follow button selector";
                        result.status = false;
                        tools.getScreenShot(casper, site, email, "followButtonTimeout");
                        callback(result);
                    }, timeout);

                }

                if (total > 0) {
                    _follow(total);
                }

            }, function () {
                result.status = false;
                result.message = "Wait timeout when waiting all follower appear.";
                tools.getScreenShot(casper, data.site, "followByFollowersFailed");
                callback(result);
            }, timeout)
        })
    }, function () {
        result.message = "can not find follow button on home page";
        callback(result);
    }, timeout);


}


function _followBySearch(casper, email, text, result, timeout, callback) {
    casper.waitUntilVisible("#search-query", function () {
        this.sendKeys("#search-query", text);
        casper.thenClick("#global-nav-search > span > button");
        casper.then(function () {
            casper.waitUntilVisible("#content-main-heading", function () {
                tools.getScreenShot(casper, site, email, "followBySearchSuccess");
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
                tools.getScreenShot(casper, site, email, "searchError");
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
    casper.capture("beginLogin.png");
    var loginButton = "#front-container > div.front-card > div.front-signin.js-front-signin > form > table > tbody > tr > td.flex-table-secondary > button";
    casper.waitUntilVisible(loginButton, function () {
        casper.sendKeys("#signin-email", data.email);
        casper.sendKeys("#signin-password", data.password);
        //casper.sendKeys("#signin-email", "sdfsdf@t1.com");
        //casper.sendKeys("#signin-password", "qweasd123");
        casper.thenClick(loginButton, function () {
            casper.waitWhileVisible(loginButton, function () {
                if (casper.exists("#page-container > div > div.signin-wrapper > form > div.clearfix > button")) {
                    result.status = false;
                    result.message = "username or password wrong";
                    tools.getScreenShot(casper, data.site, data.email, "loginFailed");
                    callback(result);
                } else {
                    tools.getScreenShot(casper, data.site, data.email, "loginSuccess");
                    executeCallback();
                }
            }, function () {
                result.status = false;
                result.message = "username or password wrong1";
                tools.getScreenShot(casper, data.site, data.email, "loginButtonMissed");
                callback(result);
            }, timeout);
        });
    }, function () {
        capsper.log("can't find email input . assume no need login", "error");
        tools.getScreenShot(casper, data.site, data.email, "noNeedLogin");
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