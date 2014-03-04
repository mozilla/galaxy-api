var stripe = require('stripe');

var settings = require('../settings_local.js');
var user = require('./user');

stripe = stripe(settings.STRIPE_API_KEY);


function createSingleUseToken(tokenData, devAccessToken, callback) {
    stripe.tokens.create(tokenData, devAccessToken, callback);
}

exports.createSingleUseToken = createSingleUseToken;


/* Create a Stripe Customer from a single Use Token. 
    Stripe Customers provide a way to save Card info.
*/
function createCustomerToken(user, singleUseToken) {
    //Promise-like
    return stripe.customers.create({
        card: singleUseToken,
        description: user.email
    });

}

exports.createCustomerToken = createCustomerToken;

/* Charge a Customer's Card. Either provide a Stripe Customer Token or 
    a card to charge (this card can be in the form of a single use token, or just
    json with "number", "exp_month", "exp_year", and "cvc" specified)
*/
function chargeCustomerCard(payment, customerToken, card) {
    if (customerToken) {
        payment.customer = customerToken;
    }
    if (card) {
        payment.card = card;
    }
    //Promise-like
    return stripe.charges.create(payment);

}

exports.chargeCustomerCard = chargeCustomerCard;

// Saves a customer's StripeToken for later
function saveCustomerToken(client, buyer, customerToken, callback) {
    user.updateUser(client, buyer.id, {
        stripeCustomerToken: customerToken
    }, function(err, newData) {
        if (err) {
            callback('db_error');
        } else {
            callback(null, customerToken)
        }
    });
}

exports.saveCustomerToken = saveCustomerToken;

// Check if right attributes are present
function checkPaymentDetails(payment) {
    return payment.amount && payment.description && payment.currency;
}

exports.checkPaymentDetails = checkPaymentDetails;

// Check if right attributes are present
function checkCardObj(card) {
    return card.number && card.exp_month && card.exp_year && card.cvc;
}

exports.checkCardObj = checkCardObj;
