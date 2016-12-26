var huf = require('./index');
var j = require('request').jar();
const _ = require('underscore');
const request = require('request').defaults({
    timeout: 30000,
    jar: j
});
const cheerio = require('cheerio');
const async = require('async');
var configuration

try {
    configuration = require('./config.json');
} catch (e) {
    return huf.log('error', 'Missing, config.json file please create your config file before using hufbot.')
}

var stack = []

function seek(config, i, callback) {
  huf.log('info', `Task ${i} Started`);
  huf.log('info', 'Seeking for item...')
  huf.seekForItem(config.page, config.keywords, (response, err) => {
      // Handle Site Crashes
      if (err || response == null) {
          if (config.autoRetryOnCrash == true) {
              return seek(config, i, callback);
          } else {
              return huf.log('error', err);
          }
      }
      return addToCart(config, response);
  });
}

for (i in configuration) {
  stack.push(seek(configuration[i], i))
}

async.each(stack, function(res, err) {});

function addToCart(config, response) {

    huf.log('success', `Found your item "${response.name}"`)

    var link, id;
    request({
        url: response.link,
        method: 'get'
    }, function(err, res, body) {

        if (err) {
            return huf.log('error', 'Error has occured while getting product information.')
        } else {
            var $ = cheerio.load(body);
        }

        var itemSelectSize = $(`option:contains("${config.size}")`).attr('value');
        if (itemSelectSize == undefined) {
            return huf.log('error', `Could not find item available in size ${config.size}`)
        } else {
            huf.log('success', `Found item available in size ${config.size}`)
        }

        // if there is only one style open then cop that only one just incase styling was inputted wrong
        var variants = [];
        $('#product-select option').each(function(i, element) {
            var sizeAndPrice = $(this).text().split(" /")[1];
            var data = {
                id: $(this).attr('value'),
                style: $(this).text().split(" /")[0],
                size: sizeAndPrice.split(" ")[1]
            }
            variants.push(data);
        });

        //huf.log('info', variants)
        var firstItemStyle = variants[0].style;

        function isSameStyle(el, index, arr) {
            if (index === 0) {
                return true;
            } else {
                return (el.style === arr[index - 1].style);
            }
        }

        var isEveryStyleTheSame = variants.every(isSameStyle);

        if (isEveryStyleTheSame) {
            huf.log('warning', `Every item variant is the same, your item will be checked out in ${variants[0].style}`)
            var itemToBuy = _.where(variants, {
                style: variants[0].style,
                size: config.size
            });
            huf.log('info', `Checkout out in ${variants[0].style} in size ${config.size} - ${itemToBuy[0].id}`)
            return getSessionID(response.link, itemToBuy[0].id, config);
        } else {
            var itemToBuy = _.where(variants, {
                size: config.size
            });
            if (itemToBuy.indexOf(config.color) > -1) {
                return getSessionID(response.link, itemToBuy[0].id, config);
            } else {
                return huf.log('error', 'Error occured while trying to find your item using the keywords provided.')
            }
        }

    });

}

function getSessionID(link, id, config) {
    huf.log('info', 'Collecting Session ID...')
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
            return huf.log('error', 'Error has occured while trying to pickup session id')
        }

        return atc(link, id, config);

    });
}

function atc(link, id, config) {

    huf.log('info', 'Adding to Cart...')
    huf.log('info', id)

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
            return huf.log('error', 'Error occured while trying to add item to your cart.')
        } else {
            var $ = cheerio.load(body);
        }

        huf.log('success', '"' + $('.name').text() + '"' + ' added to cart')
        huf.log('success', 'Price: ' + '$' + $('.unit_price').text())

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
            return huf.log('error', 'Error occured while trying to add item to your cart.')
        } else {
            var $ = cheerio.load(body);
        }

        var cookies = j.getCookies('http://store.hufworldwide.com');
        var storeID = $('.edit_checkout').attr('action').split('/')[1];
        huf.log('info', storeID)
        var checkoutID = $('.edit_checkout').attr('action').split('checkouts/')[1];
        huf.log('info', 'Checkout ID: ' + checkoutID)
        var auth_token = $('input[name=authenticity_token]').attr('value');
        huf.log('info', 'Auth Token Value: ' + auth_token)
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

    huf.log('info', id + ' ' + checkoutID)

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
            return huf.log('error', 'Error occured while trying to add item to your cart.')
        } else {
            var $ = cheerio.load(body);
        }

        huf.log('info', 'Looking for shipping options, please wait...')
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
            'checkout[shipping_address][phone]': config.billingInfo.phoneNumberFormatted,
            'checkout[remember_me]': '0',
            'checkout[client_details][browser_width]': '979',
            'checkout[client_details][browser_height]': '631',
            'checkout[client_details][javascript_enabled]': '1',
            'previous_step': 'contact_information',
            'step': 'shipping_method'
        }
    }, function(err, res, body) {
        if (err || body === undefined) {
            return huf.log('error', 'Error occured while trying to setup shipping options.')
        } else {
            var $ = cheerio.load(body);
            // if cheerio cant find the first shipping choice retry again
            var option_1_radio = $('.input-radio').attr('value');
            if ($('.input-radio').eq(1).attr('value') === undefined) {
                return ship(id, checkoutID, storeID, auth_token, config);
            } else {
                // shipping options are static after numerous requests
                var option_1_radio_dec_val = $('.input-radio').eq(0).attr('value');
                var auth = $('input[name=authenticity_token]').attr('value');
                huf.log('success', 'Cheapest Shipping Option Value: ' + option_1_radio_dec_val)
                return submitShippingChoice(storeID, checkoutID, $('input[name=authenticity_token]').attr('value'), option_1_radio_dec_val, config);
            }
        }
    });
}

function submitShippingChoice(storeID, checkoutID, auth_token, shippingRateID, config) {
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
            'Referer': `https://checkout.shopify.com/${storeID}/checkouts/${checkoutID}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        },
        formData: {
            'utf8': '✓',
            '_method': 'patch',
            'authenticity_token': auth_token,
            'button': '',
            'previous_step': 'shipping_method',
            'step': 'payment_method',
            'checkout[shipping_rate][id]': shippingRateID
        }
    }, function(err, res, body) {

        if (err || body === undefined) {
            return huf.log('error', 'Error occured while trying to pay for your item.')
        } else {
            var $ = cheerio.load(body);
        }
        huf.log('success', 'Shipping option has been picked.')
        var auth_token = $('input[name=authenticity_token]').attr('value')
        var payment_gateway = $('input[name="checkout[payment_gateway]"]').eq(0).attr('value')
        var checkout_total_price = $('checkout_total_price').attr('value')
        return sendCCInfo(auth_token, storeID, checkoutID, config, payment_gateway, checkout_total_price)

    });

}

function sendCCInfo(auth_token, storeID, checkoutID, config, payment_gateway, checkout_total_price) {
    huf.log('success', 'Sending your CC information to Shopify\'s services...')
    request({
        url: 'https://elb.deposit.shopifycs.com/sessions',
        followAllRedirects: true,
        method: 'post',
        headers: {
            'accept': 'application/json',
            'Origin': 'https://checkout.shopifycs.com',
            'Accept-Language': 'en-US,en;q=0.8',
            'Host': 'elb.deposit.shopifycs.com',
            'content-type': 'application/json',
            'Referer': `https://checkout.shopifycs.com/number?identifier=${checkoutID}&location=https%3A%2F%2Fcheckout.shopify.com%2F${storeID}%2Fcheckouts%2F${checkoutID}%3Fprevious_step%3Dshipping_method%26step%3Dpayment_method`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        },
        form: {
                'credit_card': {
                    'number': config.cardInfo.number,
                    'name': config.cardInfo.nameOnCard,
                    'month': config.cardInfo.month,
                    'year': config.cardInfo.year,
                    'verification_value': config.cardInfo.cvv,
                }
        }
    }, function(err, res, body) {

        if (err || body === undefined) {
            return huf.log('error', 'Error occured while trying to verify your card with Shopfiy.')
        } else {
            huf.log('success', 'Card Information verified by Shopify!')
            var cc_verify_id = JSON.parse(body).id
            return checkoutCardFinal(auth_token, config, storeID, checkoutID, cc_verify_id, payment_gateway, checkout_total_price)
        }
    });
}

function checkoutCardFinal(auth_token, config, storeID, checkoutID, cc_verify_id, payment_gateway, checkout_total_price) {
  request({
      url: `https://checkout.shopify.com/${storeID}/checkouts/${checkoutID}`,
      followAllRedirects: true,
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
        '_method': 'patch',
        'authenticity_token': auth_token,
        'checkout[buyer_accepts_marketing]': '1', // newsletter
        'checkout[client_details][browser_height]': '979',
        'checkout[client_details][browser_width]': '631',
        'checkout[client_details][javascript_enabled]': '1',
        'checkout[credit_card][vault]': 'false',
        'checkout[different_billing_address]': 'false',
        'checkout[payment_gateway]': payment_gateway,
        'checkout[total_price]': checkout_total_price,
        'complete': '1',
        'previous_step': 'payment_method',
        's': cc_verify_id,
        'step': '',
        'utf8': '✓'
      }
  }, function(err, res, body) {

      if (err || body === undefined) {
          return huf.log('error', 'Error occured while trying to verify your card with Shopfiy.')
      } else {
          huf.log('success', 'Payment Successful!')
      }

  });
}
