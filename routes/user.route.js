const router = require("express").Router();
const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { OAuth2Client } = require("google-auth-library");
const Axios = require("axios");
const config = require("../config/config.json");

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
    } else if (result === false && info != undefined) {
      return res.json({
        code: 3,
        data: {
          message: info.message,
        },
      });
    } else {
      req.logIn(result, async (err) => {
        const entity = {
          id: result.insertId,
          nickname: req.body.nickname,
          email: req.body.email,
        };
        console.log(entity);
        console.log(info);
        await userModel
          .editById(entity)
          .then(() => {
            return res.json({
              code: 0,
              data: {
                id: entity.id,
              },
            });
          })
          .catch((err) => {
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
  const platform = req.body.platform;
  const token = req.body.token;
  const client = new OAuth2Client(config.google_client_id);
  let openId, email;
  switch (platform) {
    case "google":
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.google_client_id,
      });
      const payload = ticket.getPayload();
      openId = payload.sub;
      email = payload.email;
      break;
    case "facebook":
      Axios.get("https://graph.facebook.com/debug_token?", {
        params: {
          input_token: token,
          access_token: config.facebook_access_token,
        },
      }).then((res) => {
        console.log(res.data);
        if (
          res.data.data.app_id === config.facebook_app_id &&
          res.data.data.is_valid
        ) {
          openId = res.data.data.user_id;
          Axios.get(`https://graph.facebook.com/${openId}`, {
            params: {
              fields:"id,email",
              access_token: token,
            },
          }).then((res) => {
            console.log(res.data);
            email = res.data.email;
          });
        } else {
          return res.json({
            code: -1,
            data: {
              message: "Unauthorize !",
            },
          });
        }
      });
      break;
    default:
    // throw { code: 3, data: { message: "Unauthorize" } };
  }

  const user = await userModel.loadByOpenId({ openId, platform });
  if (!user) {
    return res.json({
      code: 1,
      data: {
        profile: { open_id: openId, platform, email },
      },
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
      config.secret
    );
    return res.json({
      code: 0,
      data: {
        token,
      },
    });
  }
});

router.post("/login-other/recieve-nickname", async (req, res) => {
  console.log(req.body);
  const { nickname, profile } = req.body;
  await userModel
    .add({
      nickname: nickname.nickname,
      email: profile.email,
      platform: profile.platform,
      open_id: profile.open_id,
    })
    .then((user) => {
      const token = jwt.sign(
        {
          dat: {
            id: user.insertId,
            username: profile.username,
            nickname: nickname.nickname,
          },
        },
        config.secret
      );
      return res.json({
        code: 0,
        data: {
          token,
        },
      });
    });
});

module.exports = router;
