var huf = require('./index');

var page = 'http://store.hufworldwide.com/collections/huf-x-ftp';
var keywordsForProduct = 'SOTO'
var size = '13';
var color = 'Black';
var autoRetry = true;

var ccAndBillingInfo = {

};

seek(page, keywordsForProduct, autoRetry, size, color, ccAndBillingInfo);

function seek(link, keywords, size, style, retry, cc) {
	console.log('Seeking for item...');
	huf.seekForItem(link, keywords, (response, err) => {

		// Handle Site Crashes
		if (err) {
			if (retry == true) {
				return seek(link, keywords, retry);
			} else {
				return console.log(err);
			}
		}

		// When Item is found add to cart
		addToCart(link, size, style, cc);

	});
}

function addToCart(link, size, style, cc) {

	// HTTP GET - http://store.hufworldwide.com/cart.js

}