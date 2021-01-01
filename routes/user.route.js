const router = require("express").Router();
const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { OAuth2Client } = require("google-auth-library");
const Axios = require("axios");
const config = require("../config/config.json");
const nodemailer = require("nodemailer");
const cryptoRandomString = require("crypto-random-string");
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
        if (user.status === "inactivated") {
          const email_token = jwt.sign(
            {
              email: user.email,
            },
            config.secret
          );
          return res.json({
            code: 3,
            data: {
              email_token: email_token,
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
            const email_token = jwt.sign(
              {
                email: entity.email,
              },
              config.secret
            );
            return res.json({
              code: 0,
              data: {
                email_token: email_token,
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
      await Axios.get("https://graph.facebook.com/debug_token?", {
        params: {
          input_token: token,
          access_token: config.facebook_access_token,
        },
      }).then(async (res) => {
        // console.log(res.data);
        if (
          res.data.data.app_id === config.facebook_app_id &&
          res.data.data.is_valid
        ) {
          openId = res.data.data.user_id;
          tempOpenId = openId;
          await Axios.get(`https://graph.facebook.com/${openId}`, {
            params: {
              fields: "id,email",
              access_token: token,
            },
          }).then((res) => {
            // console.log(res.data);
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

  console.log(openId);

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
      username: profile.email,
      nickname: nickname.nickname,
      email: profile.email,
      platform: profile.platform,
      open_id: profile.open_id,
      status: "activated",
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

router.post("/send-email", async (req, res) => {
  const email = jwt.verify(req.body.email_token, config.secret).email;
  console.log(email);

  const otp = cryptoRandomString({
    length: 8,
    type: "numeric",
  });

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    secure: false, // true for 465, false for other ports
    auth: {
      user: "vophong1612@gmail.com", // generated ethereal user
      pass: "Vothanhphong", // generated ethereal password
    },
  });

  const mainOptions = {
    // thiết lập đối tượng, nội dung gửi mail
    from: "Caro Online",
    to: email,
    subject: "MÃ XÁC THỰC TÀI KHOẢN",
    text:
      "Mã OTP của bạn là: " +
      otp +
      ".\n Vui lòng không chia sẻ mã cho bất kỳ ai !",
  };
  transporter.sendMail(mainOptions, function (err, info) {
    if (err) {
      return res.json({
        code: 1,
        data: {
          message: "Không thể gửi mã xác thực tới email của bạn !",
        },
      });
    } else {
      console.log("sent ok");
      console.log("Message sent: " + info.response);
      const otp_token = jwt.sign(
        {
          otp: otp,
          email: email,
        },
        config.secret
      );
      return res.json({
        code: 0,
        data: {
          otp_token: otp_token,
        },
      });
    }
  });
});

router.put("/activated", async (req, res) => {
  const { otp_token, activate_code } = req.body;
  if (otp_token) {
    const { otp, email } = jwt.verify(otp_token, config.secret);
    if (otp == activate_code) {
      const entity = { email: email, status: "activated" };
      await userModel
        .editByEmail(entity)
        .then(() => {
          return res.json({
            code: 0,
          });
        })
        .catch((err) => {
          return res.json({
            code: 1,
          });
        });
    } else {
      console.log(otp);
      return res.json({
        code: 3,
      });
    }
  }
});

router.get("/forgot-password/find-user", async (req, res) => {
  const username = req.query.username;
  await userModel.loadByUserName(username).then(async (user) => {
    if (!user) {
      return res.json({
        code: 1,
        data: {
          message: "Không thể tìm thấy tài khoản!",
        },
      });
    } else {
      const email_token = jwt.sign(
        {
          email: user.email,
        },
        config.secret
      );
      let code, otp_token;
      await Axios.post("http://localhost:8000/user/send-email", {
        email_token: email_token,
      }).then((result) => {
        if (result.data.code === 0) {
          code = 0;
          otp_token = result.data.data.otp_token;
        }
      });
      console.log(code);
      return res.json({
        code: code,
        data: {
          otp_token: otp_token,
          email_token: email_token,
        },
      });
    }
  });
});

router.post("/forgot-password/change-password", async (req, res) => {
  const { otp_token, activate_code, password } = req.body;
  const otp_payload = jwt.verify(otp_token, config.secret);
  const otp = otp_payload.otp;
  const email = otp_payload.email;
  console.log(otp, email);
  if (otp === activate_code) {
    bcrypt.hash(password, 10).then(async (hash) => {
      await userModel
        .editByEmail({ email: email, password: hash })
        .then(() => {
          return res.json({
            code: 0,
          });
        })
        .catch((err) => {
          return res.json({
            code: 1,
            data: {
              message: "Có gì đó không ổn!",
            },
          });
        });
    });
  } else {
    return res.json({
      code: 2,
      data: { message: "Mã xác thực không chính xác" },
    });
  }
});

module.exports = router;
