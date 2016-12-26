const cheerio = require('cheerio')
const colors = require('colors')
var api = {};

api.seekForItem = function(configuration, link, productKeywords, callback) {
    if (configuration.proxy.active) {
      if (configuration.proxy.username == null || configuration.proxy.username == "" && configuration.proxy.password == null || configuration.proxy.password == "") {
          // no auth
          var proxyUrl = configuration.proxy.host
      } else {
          // auth
          var proxyUrl = "http://" + user + ":" + password + "@" + host + ":" + port;
      }

      var request = require('request').defaults({
          timeout: 30000,
          proxy: proxyUrl
      });
    } else {
      var request = require('request').defaults({
          timeout: 30000
      });
    }

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

// warning, error, info, success
api.log = function(task, type, text) {

    var date = new Date()
    var formatted = date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")


    switch (type) {
        case "warning":
            console.log(`[Task #${task}][${formatted}] ${text}`.yellow)
            break;
        case "error":
            console.log(`[Task #${task}][${formatted}] ${text}`.red)
            break;
        case "info":
            console.log(`[Task #${task}][${formatted}] ${text}`.cyan)
            break;
        case "success":
            console.log(`[Task #${task}][${formatted}] ${text}`.green)
            break;

        default:
            console.log(`[Task #${task}][${formatted}] ${text}`.white)
    }
}

module.exports = api;
