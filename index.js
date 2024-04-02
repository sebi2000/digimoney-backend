/*
  index.js

  This file is the entry point for the server. It is responsible for initializing the server and connecting to the database.

*/

require("dotenv").config(); // Get access to environment variables
const constants = require("./src/constants/values.js"); // Get access to global constants

// Dependencies
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const cors = require('cors');

// MongoDB models
const Currency = require("./src/models/currency.js");
const CurrencyHistory = require("./src/models/currencyHistory.js");
const Users = require("./src/models/users.js");

// Middleware
const isAuth = require("./src/middleware/isAuth.js");

// Routes
const gitHubRoutes =      require("./src/routes/auth/githubOAuth.js");
const googleRoutes =      require("./src/routes/auth/googleOAuth.js");
const registerRoutes =    require('./src/routes/register/register.js')
const loginRoutes =       require('./src/routes/auth/login.js')
const cryptoRoutes =      require('./src/routes/crypto/crypto')
const profileRoutes =     require('./src/routes/profile/profile')
const transactionRoutes = require('./src/routes/transaction/transaction')
const walletRoutes =      require('./src/routes/crypto/wallet')
const forumRoutes =       require('./src/routes/forum/forum')
const currencyRoutes =    require('./src/routes/currency/currency')
// ----------------------------------------------

const server = express(); // Initialize server

mongoose.connect( // Connect to MongoDB
  process.env.MONGO_DB_CONN_STRING,
  {
    dbName: "cryptoexchange",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (e) => {
    console.log("db connection", !e ? "successfull" : e);
    if (!e) { // If connection is successful
      Currency.countDocuments({}, (err, count) => {
        if (err) console.log("[ERROR] index.js: mongoose.connect: ", err);
        else if (!count) // If there are no currencies in the DB, create them
          createCurrency();
      });

      // Update crypto data every 5 seconds
      setInterval(function() {
        updateCrypto();
      }, 5000);
    }
  }
);

// Middlewares initialization
server.use(express.json())

server.use(session(
  {
    secret: "cryptoexchangeSecretKey",
    saveUninitialized: false,
    resave: false,
	  stripe_sess_id: ""
  }
));

server.use(passport.initialize()) // Use passport.session() middleware, to support persistent login sessions.
server.use(passport.session())

server.use(cors(
  {
    origin: 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  }
));

// Connect the routes to the server
server.use(gitHubRoutes)
server.use(googleRoutes)
server.use(loginRoutes)

server.use(cryptoRoutes)
server.use(walletRoutes)

server.use(forumRoutes)

server.use(profileRoutes)

server.use(registerRoutes)

server.use(transactionRoutes)

server.use(currencyRoutes)

// Error, user info and logout handling
server.get(constants.UNAUTHORIZED_URL, (req, res) => {
  res.status(401).send("Unauthorized, please login");
});

server.get("/api/user", isAuth, async (req, res) => {
  const dbUser = await Users.findById(req.session.passport.user._id);

  if (dbUser)
    return res.send(dbUser);

  return res.redirect(constants.UNAUTHORIZED_URL);
});

server.use("/api/users/:id", isAuth, async (req, res) => {
  const dbUser = await Users.findById(req.params.id);

  if (dbUser)
    return res.send(dbUser);

  return res.redirect(constants.UNAUTHORIZED_URL);
});

server.get('/logout', async (req, res) => {
  await req.session.destroy();

  res.redirect('http://localhost:3000/');
});

// Start the server
console.log("server at http://localhost:1234/api/");
server.listen(1234);

// Initial seeding of the database with currencies
const createCurrency = async () => {
  const currencyList = [
    {
      name: "xUSD",
    },
    {
      name: "Bitcoin",
      slug: "bitcoin",
      ratio: 2.5,
      exchangeAmount: 1000000
    },
    {
      name: "Ethereum",
      slug: "ethereum",
      ratio: 2.0,
      exchangeAmount: 2100000
    },
    {
      name: "Tether",
      slug: "tether",
      ratio: 2.2,
      exchangeAmount: 1500000
    },
    {
      name: "BNB",
      slug: "bnb",
      ratio: 1.9,
      exchangeAmount: 1900000
    },
    {
      name: "USD Coin",
      slug: "usd-coin",
      ratio: 0.99,
      exchangeAmount: 1200000
    },
    {
      name: "XRP",
      slug: "xrp",
      ratio: 0.7,
      exchangeAmount: 2000000
    }
  ];

  const currencies = await Currency.insertMany(currencyList);
  
  currencies.forEach(async currency => {
    if (currency.name !== 'xUSD')
      await CurrencyHistory.create(
        {
          currencyId: currency._id,
          ratio: currency.ratio,
        }
      );
  });
}

/*
  This function updates the crypto data in the DB. It is called at a regular interval.
  It uses the CoinMarketCap API to get the latest prices of the currencies and select the best one.

  $params: none
  $return: none
*/
const updateCrypto = async () => {
  const got = require('got');

  const API_URL = 'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/market-pairs/latest?start=1&limit=6&category=spot&centerType=all&sort=cmc_rank_advanced';
  const coin_list = await Currency.find({}); // Get all currencies in the DB
  
  coin_list.forEach(async coin => {
    if (coin.slug != '') {
      try {
        // If we have the slug (a.k.a. the unique name of the currency), get the latest price
        const response = await got(API_URL + '&slug=' + coin.slug);
        const data = JSON.parse(response.body);

        if (data.status.error_code == '0') { // On success
          let price = data.data.marketPairs[0].price;

          price += (Math.random() * 0.1 - 0.05); // Add a bit of randomness to emphasise changes

          let new_ratio = price.toString().substring(0, 10); // Keep only the first 10 digits (for styling purposes)

          // Update the currency with the latest price
          await Currency.findByIdAndUpdate(
            coin._id,
            { $set: {ratio: parseFloat(new_ratio)} }
          );
        }
      } catch (error) {
        console.log("[ERROR] index.js: updateCrypto: ", error);
      }
    }
  });
}
