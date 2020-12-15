const router = require("express").Router();
const roomModel = require("../models/room.model");
const jwt = require("jsonwebtoken");
const cryptoRandomString = require("crypto-random-string");

router.post("/new-room", async (req, res) => {
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

router.get("/room-by-join-code", async (req, res) => {
  const entity = req.query;
  console.log(req.query);
  const rows = await roomModel.loadByJoinCode(entity.join_code);
  if (rows) {
    res.json({
      code: 0,
      data: {
        room_id: rows.id,
      },
    });
  }

  res.json({
    code: 1,
    data: {
      message: "No room !",
    },
  });
});

//user send their play
router.post("/play", async (req, res) => {
  await roomModel.changeHistory(
    req.body.room_id,
    JSON.stringify(req.body.data)
  );
  res.json({
    code: 0,
  });
});

//user get game board
router.get("/play", async (req, res) => {
  const rows = await roomModel.loadById(req.query.room_id);
  console.log(rows[0].history);
  res.json({
    code: 0,
    data: rows[0].history
  })
})

module.exports = router;
