const router = require("express").Router();
const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { async } = require("crypto-random-string");

//login
router.post("/", async (req, res) => {
  passport.authenticate("login", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.json({
        code: 1,
        message: "Something is wrong !",
      });
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) {
        return res.json({
          code: 2,
          message: "Login Fail",
        });
      } else {
        const token = jwt.sign(
          {
            dat: {
              id: user.id,
              username: user.username,
              nickname: user.nickname,
            },
          },
          "secret"
        );
        return res.json({
          code: 0,
          data: {
            token,
          },
        });
      }
    });
  })(req, res);
});

//register
router.put("/", async (req, res) => {
  passport.authenticate("register", async (err, result, info) => {
    if (err) {
      return res.json({
        code: 1,
        data: {
          message: err,
        },
      });
    } else if (!result && info != undefined)
    {
      return res.json({
        code: 3,
        data: {
          message: info.message
        }
      });
    } else {
      req.logIn(result, async (err) => {
        const entity = {
          id: result.insertId,
          nickname: req.body.nickname,
        };
        console.log(entity.nickname);
        console.log(info);
        await userModel.editById(entity).then(() => {
          return res.json({
            code: 0,
            data: {
              id: entity.id,
            },
          });
        }).catch((err) => {
          return res.json({
            code: 2,
            data: {
              message: "Something was wrong",
            },
          });
        });
      });
    }
  })(req, res);
  // const entity = req.body;
  // bcrypt.hash(entity.password, 10).then(async (hash) => {
  //   console.log(hash);
  //   entity.password = hash;
  //   await userModel
  //     .add(entity)
  //     .then((response) => {
  //       res.json({
  //         code: 0,
  //         data: {
  //           id: response.insertId,
  //         },
  //       });
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       res.json({
  //         code: 1,
  //         data: {
  //           message: "Fail to add user!",
  //         },
  //       });
  //     });
  // });
});

module.exports = router;
