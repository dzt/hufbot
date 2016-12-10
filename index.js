const request = require('request').defaults({
     timeout: 30000
});
const cheerio = require('cheerio');

var api = {};

api.seekForItem = function(link, productKeywords, callback) {

	request(link, function(err, resp, html, rrr, body) {

		if (err) {
			return callback(null, 'No response from website, failed to load data.');
		} else {
			var $ = cheerio.load(html);
		}

		var response = {
			proudctCount:$('.product').length,
			productDetails: []
		}

		var matches = [];

		$('.product .details').each(function(i, element) {
			var nextElement = $(this).next();
            var prevElement = $(this).prev();
            var details = $(this).has('.details a');

            if ($('.sold').eq(i).text() == '') {
            	var status = 'Available';
            } else {
            	var status = 'Sold Out';
            }

            var product = {
            	name: $('.title').eq(i).text(),
            	status: status,
            	link: 'http://store.hufworldwide.com' + $('.title').parent().attr('href')
            }
            response.productDetails.push(product);
		});

		for (i = 0; i < response.productDetails.length; i++) {
			var title = response.productDetails[i].name;
			if (title.indexOf(productKeywords) > -1) {
					matches.push(response.productDetails[i]);
                    return callback(response.productDetails[i], null);
                    break;

                } else {
                    continue;
            }
		}

		if (matches[0] === undefined) {
            return callback(null, "Could not find any results matching your keywords.");
        }

	});

}

api.addToCart = function(link, size, style, cc, callback) {



}

module.exports = api;
