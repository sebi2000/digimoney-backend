const constants = require("../constants/values.js");
const Users = require("../models/users.js");

// Simple route middleware to ensure user is authenticated and authorized.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page/unauthorized page.
async function isAuth(req, res, next) {
  if (req.isAuthenticated()) {
    const sessUser = req.session.passport.user;

    // check if user is authorized
    let authorizeCondition = false;
    switch (sessUser.provider) {
      case "github":
        authorizeCondition = await Users.findOne({
          userId: req.session.passport.user.id,
          username: req.session.passport.user.username,
        });
        break;
      case "google":
        authorizeCondition = await Users.findOne({
          userId: req.session.passport.user.id,
          email: req.session.passport.user.email,
        });
      default:
        authorizeCondition = await Users.findOne({
          id: req.session.passport.user.id,
          email: req.session.passport.user.email,
        });
    }
    if (authorizeCondition) {
      return next();
    }
    return res.redirect(constants.UNAUTHORIZED_URL);
  }
  return res.redirect(constants.UNAUTHORIZED_URL);
}

module.exports = isAuth;
