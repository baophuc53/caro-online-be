const passport = require("passport");

module.exports = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, async (err, user, info) => {
    if (err) {
      return next(err);
    } else if (!user && info != undefined) {
      return next(info);
    } else {
      req.user = user;
      next();
    }
  })(req, res, next);
};
