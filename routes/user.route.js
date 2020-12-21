const router = require("express").Router();
const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

//login
router.post("/", async (req, res) => {
  const { username, password } = req.body;
  const dat = await userModel.loadByUserName(username);
  if (dat && (await bcrypt.compare(password, dat.password))) {
    const token = jwt.sign({ dat: {id: dat.id, username, nickname: dat.nickname } }, "secret");

    res.json({
      code: 0,
      data: {
        token,
      },
    });
  } else {
    res.json({
      code: 1,
      message: "login fail",
    });
  }
});

//register
router.put("/", async (req, res) => {
  const entity = req.body;
  bcrypt.hash(entity.password, 10).then(async (hash) => {
    console.log(hash);
    entity.password = hash;
    await userModel
      .add(entity)
      .then((response) => {
        res.json({
          code: 0,
          data: {
            id: response.insertId,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        res.json({
          code: 1,
          data: {
            message: "Fail to add user!",
          },
        });
      });
  });
});

module.exports = router;
