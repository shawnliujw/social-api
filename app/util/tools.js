/**
 * Created by Shawn Liu on 2014/12/4.
 */
exports.getScreenShot = function (casper, site, type) {
    casper.log("Capturing .............", "info");
    var date = new Date().getTime();
    var name = site + "-" + type + "-" + date + ".png";
    casper.capture(name);
}

exports.random = function (min, max) {
    var array = [];
    for (var i = min; i < max + 1; i++) {
        array.push(i);
    }
    return array[Math.floor(Math.random() * array.length)];
}