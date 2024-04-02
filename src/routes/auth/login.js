// Dependencies
const express = require("express")
const passport = require("passport")
const LocalStrategy = require('passport-local')

// MongoDB models
const Users = require("../../models/users")

// Services
const passManager = require('../../services/passwordManager')
// ----------------------------------------------

const server = express()

server.use(express.json())
passport.use(
  new LocalStrategy(
    (username, password, done) => {
      Users.findOne({ username: username }, async (err, user) => {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        
        const valid = await passManager.comparePassword(password, user.password).then(resp => resp);

        if (!valid) return done(null, false);

        await Users.updateOne(user, { lastLogin: new Date() });
        done(null, user);
      });
    }
  )
);

passport.serializeUser( (user, done) => {
  done(null, user.id)
})

passport.deserializeUser( (obj, done) => {
  done(null, obj)
})

server.post(
  '/auth/login',
  passport.authenticate('local',
    {
      failureFlash: true
    }
  ),
  (req, res) => {
    res.redirect(`/api/users/${req.session.passport.user.id}`)
  }
);

module.exports = server
