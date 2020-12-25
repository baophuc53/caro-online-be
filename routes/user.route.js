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
});

router.post("/login-other", async (req, res) => {
  const profile = req.body;
  await userModel.loadByUserName(profile.username).then(user => {
    if (!user){
      return res.json({
        code: 1,
        data: {
          profile: profile
        }
      })
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
  })
})

router.post("/login-other/recieve-nickname", async (req, res) => {
  console.log(req.body);
  const {nickname, profile} = req.body;
  bcrypt.hash(profile.socialId, 10).then(async (hash) => {
    await userModel
      .add({ username: profile.username, password: hash, nickname: nickname.nickname })
      .then((user) => {
        const token = jwt.sign(
          {
            dat: {
              id: user.insertId,
              username: profile.username,
              nickname: nickname.nickname,
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
      });
  });
})

module.exports = router;
