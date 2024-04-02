// Dependencies
const express = require("express");
const requestIp = require('request-ip')
const got = require('got');

// Middleware
const isAuth = require("../../middleware/isAuth");
// ----------------------------------------------

const server = express()

server.use(express.json())

// Get the country of the user based on the IP address
// then get the currency of the country and exchange rate to USD
server.get('/currency', isAuth, async (req, res) => {
    // Get IP address of the user
    const clientIP = req.header('x-forwarded-for') || req.socket.remoteAddress;

    // Get country of the user based on the IP address
    var IP_API = `https://ipapi.co/${clientIP}/currency`;
    var IP_API = `https://ipapi.co/currency`;
    got(IP_API).then(response => {
        // Get currency of the country
        var currency = response.body;

        // Get exchange rate of the currency to USD
        var EXCHANGE_RATE_API = `https://www.xe.com/api/protected/statistics/?from=${currency}&to=USD`;
        var options = 
        {
            headers: {
                'authorization': 'Basic bG9kZXN0YXI6cW9kdU04emRWNDJIODl4SEFvaVlDQmp1UWxZZlRLUVA='
            }
        }

        got(EXCHANGE_RATE_API, options).then(response => {
            // Get exchange rate of the currency to USD
            var exchangeRate = JSON.parse(response.body).last1Days.average;
            
            return res.status(200).json(
                {
                    currency,
                    exchangeRate
                }
            );
        }).catch(err => {
            console.log("[ERROR] currency.js: server.get(\'currency\'): getExchangeRate: ", err);
        });
    }).catch(err => {
         console.log("[ERROR] currency.js: server.get(\'currency\'): getIP: ", err);
    });
});

module.exports = server
