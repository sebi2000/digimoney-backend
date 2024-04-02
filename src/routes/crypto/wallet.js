
// Dependencies
const express = require('express')
const cors = require('cors')

// MongoDB models
const Currency = require('../../models/currency')
const Wallet = require('../../models/wallet')

// Middleware
const isAuth = require('../../middleware/isAuth')

require('dotenv').config() // Get access to environment variables

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) // Initialize Stripe API

const server = express()

// Get the amount of xUSD currency in user's wallet
server.get('/wallet/funds', isAuth, async (req, res) => {
    const xUSD = await Currency.findOne(
        {
            "name": "xUSD"
        }
    );

    const wallet = await Wallet.find(
        {
            userId: req.session.passport.user._id,
            "currency.currencyId": xUSD._id
        }
    );

    if (!wallet) {
        return res.status(404).json(
            {
                msg: "No wallet found"
            }
        );
    }

    let wallet_size = wallet.length;
    let amount = 0;
    for (var i = 0; i < wallet_size; i++) {
        amount += wallet[i].currency[0].amount;
    }

    return res.status(200).json(
        {
            amount
        }
    );
});

// Get user's wallet
server.get('/wallet', isAuth, async (req, res) => {
    const wallet = await Wallet.find(
        {
            userId: req.session.passport.user._id
        }
    );

    if (!wallet) {
        return res.status(404).json(
            {
                msg: "No wallet found"
            }
        );
    }
    
    return res.status(200).json(
        {
            wallet
        }
    );
})

// Endpoint for Stripe API -> handles successful and failed payments
server.get("/webhook", async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    if(req.session.stripe_sess_id == "") {
        res.redirect("http://localhost:3000/main?status=402"); // No session ID found

        return;
    }
    
    const session = await stripe.checkout.sessions.retrieve(req.session.stripe_sess_id);
    req.session.stripe_sess_id = "";
    
    if (session.status !== "complete" || session.payment_status !== "paid") { // Payment failed
        res.redirect("http://localhost:3000/main?status=402");

        return ;
    }

    const amount = Number(session.amount_total) / 100;
    
    const wallet = await Wallet.findOne(
        {
            userId: req.session.passport.user._id
        }
    );

    const xUSD = await Currency.findOne(
        {
            "name": "xUSD"
        }
    );

    const totalAmount = wallet.currency[0].amount + amount;
    
    await Wallet.findOneAndUpdate(
        { // Filter
            userId: req.session.passport.user._id,
            "currency.currencyId": xUSD._id
        },
        { // Update
            $set: {
                "currency.$.amount": totalAmount
            },
        }
    );

    res.redirect("http://localhost:3000/main?status=202");
});

// Endpoint for Stripe API -> creates a new checkout session
server.post("/funds", isAuth, async (req, res) => {
    const { product } = JSON.parse(req.body.body);

    const session = await stripe.checkout.sessions.create(
        {
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: product.currency,
                        product_data: {
                            name: product.name,
                        },
                        unit_amount: product.price * 100,
                    },
                    quantity: product.quantity,
                },
            ],
            mode: "payment",
            success_url: `http://localhost:1234/webhook`,
            cancel_url: "http://localhost:1234/webhook",
        }
    );
    
    req.session.stripe_sess_id = session.id; // Save Stripe session ID to user's session
    res.json(
        {
            id: session.id
        }
    );
})

module.exports = server