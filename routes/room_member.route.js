const router = require("express").Router();
const roomMemberModel = require("../models/room_member.model");
const auth_jwt = require("../middlewares/auth.mdw")

router.post("/join-room", auth_jwt, async (req, res) => {
  const user = req.user;
  console.log(user);
  const entity = req.body;
  entity.user_id = user.id;
  console.log(entity);
  const room_members = await roomMemberModel.loadByRoomId(entity.room_id);
  if (room_members.length > 1) {
    return res.json({
      code: 1,
      message: "Full"
    })
  }
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
});

module.exports = router;
