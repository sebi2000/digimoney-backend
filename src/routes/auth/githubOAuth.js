var express = require("express");
var passport = require("passport");

var GitHubStrategy = require("passport-github2").Strategy;

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
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:1234/auth/github/callback",
      scope: ["user:email"],
    },
    function (accessToken, refreshToken, profile, done) {
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
            displayName: profile.username,
            username: profile.username,
            email: profile.emails[0].value,
            provider: "github",
          }

          let createdUser = await createUserAndWallet(newUser);
          return done(null, createdUser);
        }
      );
    }
  )
);

server.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

server.get(
  "/auth/github/callback",
  passport.authenticate("github", 
    {
      failureRedirect: constants.UNAUTHORIZED_URL,
    }
  ),
  async function (req, res) {
    res.redirect('http://localhost:3000');
  }
);

module.exports = server;
