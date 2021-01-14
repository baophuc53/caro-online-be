const passport = require("passport");
const passportJWT = require("passport-jwt");
const LocalStratrgy = require("passport-local").Strategy;
const JWTStratrgy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const userModel = require("../models/user.model");
const adminModel = require("../models/admin.model");
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
      return userModel
        .loadByUserName(username)
        .then(async (user) => {
          if (user != null) {
            return cb(null, false, {
              code: 1,
              message: "User is already exist",
            });
          } else {
            bcrypt.hash(password, 10).then(async (hash) => {
              await userModel
                .add({ username, password: hash, nickname: "new_nickname" , email: "email", status: "inactivated"})
                .then((result) => {
                  return cb(null, result, {
                    code: 0,
                    message: "Register success",
                  });
                });
            });
          }
        })
        .catch((err) => {
          return cb(err);
        });
    }
  )
);

const opts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme("token"),
  secretOrKey: "secret",
};

passport.use(
  "jwt",
  new JWTStratrgy(opts, async (jwt_payload, cb) => {
    await userModel
      .loadById(jwt_payload.dat.id)
      .then(user => {
        if (user) {
          cb(null, user);
        } else {
          cb(null, false);
        }
      })
      .catch((err) => cb(err));
  })
);

passport.use(
  "admin-jwt",
  new JWTStratrgy(opts, async (jwt_payload, cb) => {
    await adminModel
      .loadById(jwt_payload.id)
      .then(user => {
        if (user) {
          cb(null, user);
        } else {
          cb(null, false);
        }
      })
      .catch((err) => cb(err));
  })
);

module.exports = passport;
