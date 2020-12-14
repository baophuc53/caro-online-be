const router = require("express").Router();
const roomMemberModel = require("../models/room_member.model");
const jwt = require("jsonwebtoken");

router.post("/join-room", async (req, res) => {
  const entity = req.body;
  const token = req.headers.token;
  if (token) {
    const decoded = jwt.verify(token, "secret");
    const user = decoded.dat;
    entity.user_id = user.id;
    console.log(entity);
    await roomMemberModel
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
