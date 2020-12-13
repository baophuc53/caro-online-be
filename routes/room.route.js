const router = require("express").Router();
const roomModel = require("../models/room.model");
const jwt = require("jsonwebtoken");
const cryptoRandomString = require("crypto-random-string");

// //login
// router.post("/", async (req, res) => {
//   const { username, password } = req.body;
//   const dat = await userModel.loadByUserName(username);
//   if (dat && (await bcrypt.compare(password, dat.password))) {
//     const token = jwt.sign({ dat: {id: dat.id, username, nickname: dat.nickname } }, "secret");
//     req.session.token = token;
//     // console.log(req.session);

//     res.json({
//       code: 0,
//       data: {
//         token,
//       },
//     });
//   } else {
//     res.json({
//       code: 1,
//       message: "login fail",
//     });
//   }
// });

//register
router.put("/new-room", async (req, res) => {
  const entity = req.body;
  entity.join_code = cryptoRandomString({ length: 8, type: "alphanumeric" });
  console.log(req.headers.token);
  const token = req.headers.token;
  if (token) {
    const decoded = jwt.verify(token, "secret");
    const user = decoded.dat;
    entity.owner = user.username;
    await roomModel
      .add(entity)
      .then((response) => {
        res.json({
          code: 0,
          data: {
            id: response.insertId,
            join_code: entity.join_code,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        res.json({
          code: 1,
          data: {
            message: "Fail to create new room!",
          },
        });
      });
  } else {
    res.json({
      code: 2,
      data: {
        message: "Not a valid user",
      },
    });
  }
});

module.exports = router;
