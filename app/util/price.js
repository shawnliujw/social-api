/**
 * format the price to expected price .
 * @param {type} price original price.
 * @param {type} decimal  the decimal places.
 * @returns {undefined}
 */
exports.format = function(price, decimal) {
	var _price = null;
	if (price) {
		_price = 0;
		price += "";

        if (!decimal) {
            decimal = 2;
        }
        price = price.replace(",", ".");//for Germany amazon, the price is EUR 15,75
        // some uk price is xxp, the unit is penny
        price = price.replace(/[^\d.€p]/g, "");
        var pennyReg = /\d{1,}p/;
        if(pennyReg.test(price)) {
            price = parseInt(price.replace("p",""))/100;
        } else {
            price = price.replace(/p/g,"");
            if (price.indexOf("€") === 0) {
                price = price.substr(1);
            } else if (price.indexOf("€") > 0) {
                price = price.replace("€", ".");
            }
        }
        try {
            _price = parseFloat(price);
        } catch (e){
            _price = null;
        }


//		var index = price.indexOf(".");
//		if (index > -1) {
//			var price1 = price.substring(0, index);
//			if (decimal === 0) {
//				_price = price1;
//			} else {
//				var price2 = price.substr(index, decimal + 1);
//				if (price2.length < (decimal + 1)) {
//					var count = (decimal + 1) - price2.length;
//					for (var j = 0; count--; count > 0) {
//						price2 += "0";
//					}
//				} else if (price2.length > (decimal + 1)) {
//					price2 = price2.substring(0, decimal + 1);
//				}
//				_price = price1 + price2;
//
//			}
//		} else {
//			if (decimal > 0) {
//				price += ".";
//				for (var i = 0; decimal--; decimal > 0) {
//					price += "0";
//				}
//				_price = price;
//			}
//		}

	}
	return _price  ? _price.toFixed(decimal) : price;
};


