const request = require('request').defaults({
     timeout: 30000,
     jar: true
});
const cheerio = require('cheerio');

getSessionID('http://store.hufworldwide.com/products/soto-black-mono');

function getSessionID(link) {
	console.log('Collecting Session ID');
	request({
	    url: 'http://store.hufworldwide.com/cart.js',
	    method: 'get',
	    headers: {
	        'Accept': 'application/json, text/javascript, */*; q=0.01',
	        'X-Requested-With': 'XMLHttpRequest',
	        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36',
	        'Referer': link,
	        'Accept-Encoding': 'gzip, deflate, sdch',
	        'Accept-Language': 'en-US,en;q=0.8'
	    }
	}, function(err, res, body) {

		if (err) {
			return console.log('Error has occured while trying to pickup session id');
		}
	    
	    var cookies = res.headers['set-cookie'];
	    return atc(cookies, link);

	});
}

function atc(link) {

	console.log('Adding to Cart...');

	request({
	    url: 'http://store.hufworldwide.com/cart/add',
	    followAllRedirects: true,
	    method: 'post',
	    headers: {
	    	'Origin': 'http://store.hufworldwide.com',
	        'Upgrade-Insecure-Requests': '1',
	        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36',
	        'Content-Type': 'application/x-www-form-urlencoded',
	        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	        'Referer': link,
	        'Accept-Language': 'en-US,en;q=0.8'
	    },
	    formData: {
	    	'add': 'ADDING.....',
	    	'id': '18700143493'
	    }
	}, function(err, res, body) {

		if (err || body === undefined) {
			return console.log('Error occured while trying to add item to your cart.');
		} else {
			var $ = cheerio.load(body);
		}

		console.log('"' + $('.name').text() + '"' + ' added to cart');
		console.log('Price: ' + '$' + $('.unit_price').text());
	    
	});

}

function checkout() {

	request({
	    url: 'http://store.hufworldwide.com/cart',
	    followAllRedirects: true, // redirects to https checkout
	    method: 'post',
	    jar: true,
	    headers: {
	    	'Origin': 'http://store.hufworldwide.com',
	        'Upgrade-Insecure-Requests': '1',
	        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36',
	        'Content-Type': 'application/x-www-form-urlencoded',
	        'Referer': 'http://store.hufworldwide.com/cart',
	        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	        //'Accept-Encoding': 'gzip, deflate',
	        'Accept-Language': 'en-US,en;q=0.8',
	        'Cookie': 'cookie'
	    },
	    formData: {
	    	'add': 'ADDING.....',
	    	'id': '18700143493'
	    }
	}, function(err, res, body) {

		if (err || body === undefined) {
			return console.log('Error occured while trying to add item to your cart.');
		} else {
			var $ = cheerio.load(body);
		}

		console.log('"' + $('.name').text() + '"' + ' added to cart');
		console.log('Price: ' + '$' + $('.unit_price').text());
	    
	});

}