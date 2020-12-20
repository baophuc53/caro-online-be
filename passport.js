const passport = require("passport");
const LocalStratrgy = require("passport-local").Strategy;
const userModel = require("./models/user.model");
const bcrypt = require("bcrypt");

passport.use(
  "login",
  new LocalStratrgy(
    {
      usernameField: "username",
      passwordField: "password",
      session: false,
    },
    async function (username, password, cb) {
      return await userModel
        .loadByUserName(username)
        .then((user) => {
          if (!user) {
            return cb(null, false, { code: 1, message: "User does not exits" });
          } else {
            bcrypt.compare(password, user.password, (err, result) => {
              if (err || !result) {
                return cb(null, false, { code: 2, message: "Login Fail" });
              }
              return cb(null, user, { code: 0, message: "Login OK" });
            });
          }
        })
        .catch((err) => cb(err));
    }
  )
);

passport.use(
  "register",
  new LocalStratrgy(
    {
      usernameField: "username",
      passwordField: "password",
      session: false,
    },
    async function (username, password, cb) {
      return userModel.loadByUserName(username)
      .then(async (user) => {
        if (user != null) {
          return cb(null, false, { code: 1, message: "User is already exist" });
        } else {
          bcrypt.hash(password, 10).then(async (hash) => {
            await userModel
              .add({ username, password: hash, nickname: "new_nickname" })
              .then((result) => {
                return cb(null, result, { code: 0, message: "Register success" });
              });
          });
        }
      })
      .catch(err => {
          return cb(err);
      });
    }
  )
);

module.exports = passport;
