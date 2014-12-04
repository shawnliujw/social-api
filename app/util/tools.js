/**
 * Created by Shawn Liu on 2014/12/4.
 */
exports.getScreenShot = function (casper, site, type) {
    var date = new Date().toUTCString();
    var name = date + "-" + site + "-" + type + ".png";
    casper.capture(name);
}
