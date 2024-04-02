var express = require("express");
var passport = require("passport");

var GoogleStrategy = require('passport-google-oidc');

const constants = require("../../constants/values.js");
const Users = require("../../models/users.js");
const createUserAndWallet = require('../../utils/createWallet').createUserAndWallet

var server = express();

require("dotenv").config();


passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
      callbackURL: 'http://localhost:1234/auth/google/callback'
    },
    function (issuer, profile, done) {
      Users.findOne(
        {
          email: profile.emails[0].value,
        },
        async (err, user) => {
          if (err) return done(err);

          if (user) { // User exists
            await Users.updateOne(user, { lastLogin: new Date() });

            return done(null, user);
          }
          
          // User does not exist
          const newUser = {
            displayName: profile.displayName,
            username: profile.emails[0].value.split("@")[0],
            email: profile.emails[0].value,
            provider: "google",
          }

          let createdUser = await createUserAndWallet(newUser);
          return done(null, createdUser);
        }
      );
    }
));

server.get("/auth/google", passport.authenticate("google", 
  {
    scope: ["profile", "email"],
  }
  )
);

server.get(
  "/auth/google/callback",
  passport.authenticate("google",
    {
      failureRedirect: constants.UNAUTHORIZED_URL,
    }
  ),
  async function (req, res) {
    res.redirect('http://localhost:3000/');
  }
);

module.exports = server;
