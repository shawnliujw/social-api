var Promise = require("bluebird");

module.exports = function(timeout) {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve(true);
		}, timeout);
	}).cancellable();
};
