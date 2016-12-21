const request = require('request').defaults({
    timeout: 30000
})
const cheerio = require('cheerio')
const colors = require('colors')
var api = {};

api.seekForItem = function(link, productKeywords, callback) {

    request(link, function(err, resp, html, rrr, body) {

        if (err) {
            return callback(null, 'No response from website, failed to load data.');
        } else {
            var $ = cheerio.load(html);
        }

        var response = {
            proudctCount: $('.product').length,
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
                link: 'http://store.hufworldwide.com' + $('.title').eq(i).parent().attr('href')
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

// warning, error, info, success
api.log = function(type, text) {

    var date = new Date()
    var formatted = date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")


    switch (type) {
        case "warning":
            console.log(`[${formatted}] ${text}`.yellow)
            break;
        case "error":
            console.log(`[${formatted}] ${text}`.red)
            break;
        case "info":
            console.log(`[${formatted}] ${text}`.cyan)
            break;
        case "success":
            console.log(`[${formatted}] ${text}`.green)
            break;

        default:
            console.log(`[${formatted}] ${text}`.white)
    }
}

module.exports = api;
