// Dependencies
const express = require('express')

// Middleware
const isAuth = require('../../middleware/isAuth')

// MongoDB models
const Currency = require('../../models/currency')
const Wallet = require('../../models/wallet')
const CurrencyHistory = require('../../models/currencyHistory')
// ----------------------------------------------

const server = express();

// Get information about available cryptocurrencies
server.get('/crypto', isAuth, async (req, res) => {  
  const availableCrypto = await Currency.find();

  if (!availableCrypto)
    return res.status(404).json(
      {
        message: "No crypto available",
      }
    );

  const toBuy = [];

  for (const c of availableCrypto)
    if (c.name !== 'xUSD') toBuy.push(c); // Exclude xUSD from the list of available crypto

  return res.status(200).json({ toBuy });
});

// Get ratio of a specific cryptocurrency
server.get('/crypto/get', isAuth, async (req, res) => {
  const cryptoName = req.query.crypto;

  const crypto = await Currency.findOne({ name: cryptoName });

  return res.status(200).json(
    {
      ratio: crypto.ratio,
    }
  );
});

// Get information about user's wallet
server.get('/crypto-sell', isAuth, async (req, res) => {
  const user = req.session.passport.user;
  const wallet = await Wallet.findOne({ userId: user._id });

  if (!wallet)
    return res.status(404).json(
      {
        msg: 'Wallet not found'
      }
    );

  const toSell = []

  for (const c of wallet.currency) {
    const currency = await Currency.findById(c.currencyId);

    if (currency.name !== 'xUSD' && c.amount > 0.0001)
      toSell.push(
        { 
          _id: currency._id,
          name: currency.name,
          amount: c.amount,
          price: currency.ratio * c.amount
        }
      );
  }

  return res.status(200).json(
    {
      toSell,
    }
  );
});

// Get information about user's transaction history
server.get('/currency-history', isAuth, async (req, res) => {
  const { name } = req.body;
  const currency = await Currency.findOne({ name: name });
  const history = await CurrencyHistory.findOne(currency._id);

  if (!history || !currency)
    return res.status(404).json(
      {
        msg: 'Currency not found'
      }
    );

  return res.status(200).json(
    {
      ratio: history.ratio
    }
  );
})

// Get information about a currency's ratio history
server.get('/ratio-history', isAuth, async (req, res) => {
  const { id } = req.query;
  const API_URL = `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail/chart?range=1Y&id=${id}`;

  require('got').get(API_URL)
    .then(resp => {
      const data = JSON.parse(resp.body).data.points;
      let timestamps = Object.keys(data);

      var returnData = [];
      var minValue, maxValue; // Used to calculate the min and max values of the graph
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      minValue = maxValue = data[ timestamps[0] ].v[0]; // Set both min and max to the value at the first timestamp (today's value)

      for(var i = 0, len = timestamps.length; i < len; i++) {
        var date = new Date(Number(timestamps[i]) * 1000);
        var value = data[ timestamps[i] ].v[0];
        
        if (value < minValue) minValue = value;
        if (value > maxValue) maxValue = value;

        returnData.push(
          {
            name: months[date.getMonth()],
            uv: value
          }
        );
      }

      // Round the min and max values to one less than their orders of magnitude
      // i.e., 1234 -> 1200 (rounded down) and 1234 -> 1300 (rounded up)
      let mag = getMag(minValue) / 10;
      minValue = Math.floor(minValue / mag) * mag;

      mag = getMag(maxValue) / 10;
      maxValue = Math.ceil(maxValue / mag) * mag;

      return res.status(200).json(
        {
          data: returnData,
          min: minValue,
          max: maxValue
        }
      );
    }).catch(err => {
      console.log("[ERROR] crypto.js: server.get(\'/ratio-history\'): ", err);
    });
});

// Get information about the best performing cryptocurrencies
server.get('/bestData', isAuth, async (req, res) => {
  const currencies = await Currency.find({}).sort({ ratio: -1 });
  const length  = Math.min(5, currencies.length);
  var returnData = [];

  for (var i = 0; i < length; i++) {
    returnData.push({
      name: currencies[i].name,
      price: currencies[i].ratio.toFixed(2),
    });
  }

  return res.status(200).json(
    {
      data: returnData
    }
  );
});

// Get the magnitude of a number
function getMag(n) {
  var order = Math.floor(Math.log(n) / Math.LN10 + 0.000000001);
  
  return Math.pow(10, order);
}

module.exports = server
