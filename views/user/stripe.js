

var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');
var payment = require('../../lib/payment');




module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/pay' -d '_user=ssatoken&buyerId=user_id
    // &payment={"amount":100,"currency":"usd","description":"Test Payment"}
    // &card={"number":"4242424242424242","exp_month":12,"exp_year":2015,"cvc":"123"}
    // &save=1'
    server.post({
        url: '/user/pay',
        validation: {
            _user: {
                description: "A developer's SSA token",
                isRequired: true
            },
            buyerId: {
                description: 'Id of user who is going to be charged',
                isRequired: true
            },
            card: {
                description: 'Card Details for user - requires "number", "exp_month", "exp_year", and "cvc"',
                isRequired: false
            },
            payment: {
                description: 'Payment Details - requires "amount", "currency", and "description"',
                isRequired: true
            },
            save: {
                description: 'Whether or not to remember User Stripe Token - defaults to false',
                isRequired: false
            }
        },
        swagger: {
            nickname: 'payment',
            notes: 'Charge a user in-game payment',
            summary: 'User Payment'
        }
    }, db.redisView(function(client, done, req, res) {
        var POST = req.params;

        var buyerId = POST.buyerId;
        // var stripeToken = POST.stripeToken;
        var save = !!+POST.save;
        var card = POST.card ? JSON.parse(POST.card) : null;
        var paymentDetails = JSON.parse(POST.payment);
        var email = req._email;

        if (paymentDetails && !payment.checkPaymentDetails(paymentDetails)) {
            res.json(403, {error: 'bad_payment'});
            done();
            return;
        }

        if (card && !payment.checkCardObj(card)) {
            res.json(403, {error: 'bad_card'});
            done();
            return;
        }

        user.getUserFromEmail(client, email, function(err, dev) {
            if (err || !dev) {
                res.json(500, {error: 'db_error'});
                done();
                return;
            }

            // make sure user is dev
            if (!dev.permissions.developer) {
                res.json(403, {error: 'bad_permission'});
                done();
                return;
            } 

            //make sure user is connected to stripe
            if (!dev.stripeAccessToken) {
                res.json(403, {error: 'no_access_token'});
                done();
                return;
            }

            //Lookup Buyer/Customer
            user.getUserFromID(client, buyerId, function(err, buyer) {
                if (err || !buyer) {
                    res.json(500, {error: 'db_error'});
                    done();
                    return;
                }

                // Get Data for Single Use token
                var tokenData = {},
                customer;

                // If Customer Token already saved, create single use token with customer.
                if (customer = buyer.stripeCustomerToken) {
                    //TODO: Allow Customer to select a card/save multiple cards
                    tokenData.customer = customer;
                } else {
                    //Otherwise, use card details
                    tokenData.card = card;
                }

                // Create Single Use Token
                payment.createSingleUseToken(tokenData, dev.stripeAccessToken, function(err, singleUseToken) {
                    if (err) {
                        // expose error because it might help user (i.e. bad format for something, incorrect card number)
                        res.json(500, {error: err});
                        done();
                        return;
                    }

                    // If save present, Create Stripe Customer, Charge, and save customer token
                    if (save) {
                        // Create Customer
                        payment.createCustomerToken(buyer, singleUseToken.id).then(function(customer) {
                            //Charge Card
                            return payment.chargeCustomerCard(paymentDetails,customer.id)
                        }).then(function(charge) {
                            // Save Customer token
                            payment.saveCustomerToken(client, buyer, charge.customer, function(err) {
                                if (err) {
                                    // Let client know that card was charged, but not saved
                                    res.json(500, {err: 'not_saved'});
                                    done();
                                    return;
                                }

                                // Everything worked, send back relevant stuff
                                res.json(200, {
                                    amountCharged: charge.amount,
                                    description: charge.description
                                });
                                done();
                                return;
                            });
                        }, function(err) {
                            console.log(err);
                            //Payment or Customer Creation failed
                            res.json(500, {err: 'payment_error'});
                            done();
                            return;
                        });
                    } else {
                        //Just Charge Card (using singleUseToken)
                        payment.chargeCustomerCard(paymentDetails, null, singleUseToken.id).then(function(charge) {
                            res.json(200, {
                                amountCharged: charge.amount,
                                description: charge.description
                            });
                            done();
                            return;
                        }, function(err) {
                            console.log(err);
                            res.json(500, {err: 'payment_error'});
                        });

                    }
                });                

            });
            
        });
    }));
};
