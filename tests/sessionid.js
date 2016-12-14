var j = require('request').jar();
const request = require('request').defaults({
    timeout: 30000,
    jar: j
});
const cheerio = require('cheerio');
const configuration = require('./config.json');

console.log('hufbot started');
// http://store.hufworldwide.com/collections/huf-x-ftp

getSessionID('http://store.hufworldwide.com/products/cp64002-bkbne', '18923332805', configuration);

function getSessionID(link, id, config) {
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

        return atc(link, id, config);

    });
}

function atc(link, id, config) {

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
            'id': id
        }
    }, function(err, res, body) {

        if (err || body === undefined) {
            return console.log('Error occured while trying to add item to your cart.');
        } else {
            var $ = cheerio.load(body);
        }

        console.log('"' + $('.name').text() + '"' + ' added to cart');
        console.log('Price: ' + '$' + $('.unit_price').text());

        return getCheckoutPage(id, config);


    });

}

function getCheckoutPage(id, config) {

    var idVal = `updates[${id}]`;

    request({
        url: 'http://store.hufworldwide.com/cart',
        followAllRedirects: true, // redirects to https checkout
        method: 'post',
        headers: {
            'Origin': 'http://store.hufworldwide.com',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'http://store.hufworldwide.com/cart',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.8',
            'Cookie': 'cookie'
        },
        formData: {
            'attributes[nostoref]': '',
            'checkout': 'CHECKOUT',
            'note': '',
            idVal: '1'
        }
    }, function(err, res, body) {

        if (err || body === undefined) {
            return console.log('Error occured while trying to add item to your cart.');
        } else {
            var $ = cheerio.load(body);
        }

        var cookies = j.getCookies('http://store.hufworldwide.com');
        //console.log(cookies);
        var storeID = $('.edit_checkout').attr('action').split('/')[1];
        console.log('Store ID: ' + storeID);
        var checkoutID = $('.edit_checkout').attr('action').split('checkouts/')[1];
        console.log('Checkout ID: ' + checkoutID);
        var auth_token = $('input[name=authenticity_token]').attr('value');
        console.log('Auth Token Value: ' + auth_token);
        return input(id, checkoutID, auth_token, config, storeID);

    });

}

function input(id, checkoutID, auth_token, config, storeID) {

    if (config.billingInfo.company == null) {
        var company = '';
    } else {
        var company = config.billingInfo.company;
    }

    if (config.billingInfo.aptNumber == null) {
        var aptNumber = '';
    } else {
        var aptNumber = config.billingInfo.aptNumber;
    }

    console.log(id + ' ' + checkoutID);

    request({
        url: `https://checkout.shopify.com/${storeID}/checkouts/${checkoutID}`,
        followAllRedirects: true, // redirects to https checkout
        method: 'get',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.8',
            'Host': 'checkout.shopify.com',
            'Referer': `https://checkout.shopify.com/${id}/checkouts/${checkoutID}?step=contact_information`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        },
        qs: {
            'utf8': '✓',
            '_method': 'patch',
            'authenticity_token': auth_token,
            'previous_step': 'contact_information',
            'checkout[email]': config.billingInfo.email,
            'checkout[shipping_address][first_name]': config.billingInfo.firstName,
            'checkout[shipping_address][last_name]': config.billingInfo.lastName,
            'checkout[shipping_address][company]': company,
            'checkout[shipping_address][address1]': config.billingInfo.address,
            'checkout[shipping_address][address2]': aptNumber,
            'checkout[shipping_address][city]': config.billingInfo.city,
            'checkout[shipping_address][country]': config.billingInfo.country,
            'checkout[shipping_address][province]': config.billingInfo.state,
            'checkout[shipping_address][province]': '',
            'checkout[shipping_address][province]': config.billingInfo.stateFull,
            'checkout[shipping_address][zip]': config.billingInfo.zipCode,
            'checkout[shipping_address][phone]': config.billingInfo.phoneNumber,
            'checkout[remember_me]': '',
            'checkout[remember_me]': '0',
            'checkout[client_details][browser_width]': '979',
            'checkout[client_details][browser_height]': '631',
            'checkout[client_details][javascript_enabled]': '1',
            'step': 'contact_information'
        }
    }, function(err, res, body) {

        if (err || body === undefined) {
            return console.log('Error occured while trying to add item to your cart.');
        } else {
            var $ = cheerio.load(body);
        }

        return ship(id, checkoutID, storeID, $('input[name=authenticity_token]').attr('value'), config);

    });

}

function ship(id, checkoutID, storeID, auth_token, config) {

    if (config.billingInfo.company == null) {
        var company = '';
    } else {
        var company = config.billingInfo.company;
    }

    if (config.billingInfo.aptNumber == null) {
        var aptNumber = '';
    } else {
        var aptNumber = config.billingInfo.aptNumber;
    }

    request({
        url: `https://checkout.shopify.com/${storeID}/checkouts/${checkoutID}`,
        followAllRedirects: true, // redirects to https checkout
        method: 'post',
        headers: {
            'Origin': 'https://checkout.shopify.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.8',
            'Referer': `https://checkout.shopify.com/${storeID}/checkouts/${checkoutID}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        },
        formData: {
            'utf8': '✓',
            '_method': 'patch',
            'authenticity_token': auth_token,
            'button': '',
            'checkout[email]': config.billingInfo.email,
            'checkout[shipping_address][first_name]': config.billingInfo.firstName,
            'checkout[shipping_address][last_name]': config.billingInfo.lastName,
            'checkout[shipping_address][company]': company,
            'checkout[shipping_address][address1]': config.billingInfo.address,
            'checkout[shipping_address][address2]': aptNumber,
            'checkout[shipping_address][city]': config.billingInfo.city,
            'checkout[shipping_address][country]': config.billingInfo.country,
            'checkout[shipping_address][province]': config.billingInfo.stateFull,
            'checkout[shipping_address][zip]': config.billingInfo.zipCode,
            'checkout[shipping_address][phone]': config.billingInfo.phoneNumber,
            'checkout[remember_me]': '0',
            'checkout[client_details][browser_width]': '979',
            'checkout[client_details][browser_height]': '631',
            'checkout[client_details][javascript_enabled]': '1',
            'previous_step': 'contact_information',
            'step': 'shipping_method'
        }
    }, function(err, res, body) {
        if (err || body === undefined) {
            return console.log('Error occured while trying to setup shipping options.');
        } else {
            var $ = cheerio.load(body);
            // if cheerio cant find the first shipping choice retry again
            console.log('Looking for shipping options, please wait...');
            var option_1_radio = $('.input-radio').attr('value');
            if ($('.input-radio').eq(1).attr('value') === undefined) {
                return ship(id, checkoutID, storeID, auth_token, config);
            } else {
            	// shipping options are static after numerous requests
                var option_1_radio_dec_val = $('.input-radio').eq(0).attr('value');
                var auth = $('input[name=authenticity_token]').attr('value');
                console.log('Cheapest Shipping Option Value: ' + option_1_radio_dec_val);
                return submitShippingChoice(storeID, checkoutID, $('input[name=authenticity_token]').attr('value'), option_1_radio_dec_val);
            }
        }
    });
}

function submitShippingChoice(storeID, checkoutID, auth_token, shippingRateID) {
	// get to card page

    request({
        url: `https://checkout.shopify.com/${storeID}/checkouts/${checkoutID}`,
        followAllRedirects: true,
        method: 'post',
        headers: {
            'Origin': 'https://checkout.shopify.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.8',
            'Referer': `https://checkout.shopify.com/${storeID}/checkouts/${checkoutID}?previous_step=contact_information&step=shipping_method`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        },
        formData: {
            'utf8': '✓',
            '_method': 'patch',
            'authenticity_token': auth_token,
            'button': '',
            'checkout[client_details][browser_width]': '979',
            'checkout[client_details][browser_height]': '631',
            'checkout[client_details][javascript_enabled]': '1',
            'previous_step': 'shipping_method',
            'step': 'payment_method',
            'checkout[shipping_rate][id]': shippingRateID
        }
    }, function(err, res, body) {

        if (err || body === undefined) {
            return console.log('Error occured while trying to add item to your cart.');
        } else {
            var $ = cheerio.load(body);
        }

        //console.log(body);

    });

}