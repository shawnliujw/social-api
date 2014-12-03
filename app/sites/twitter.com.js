/**
 * Created by Shawn Liu on 2014/12/3.
 */

exports.registration = function (casper, data, result, timeout, callback) {
    casper.waitUntilVisible("#frontpage-signup-form > button", function () {
        casper.sendKeys("#frontpage-signup-form > div:nth-child(1) > input", data.fullName || "");
        casper.sendKeys("#frontpage-signup-form > div:nth-child(2) > input", data.email);
    }, function timeout() {
        result.status = false;
        result.message = "Wait timeout for registration button";
    }, timeout);

    casper.thenClick("#submit_button", function () {

    });
    callback(result);
}

exports.edit = function (casper, data, result, callback) {

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