/**
 * Created by Shawn Liu on 2014/12/3.
 */
var tools = require("../util/tools");
exports.registration = function (casper, data, result, timeout, callback) {

}

exports.edit = function (casper, data, result, callback) {

}

exports.operation = function (casper, data, result, callback) {

}

function _login(casper, data, result, timeout, callback) {
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