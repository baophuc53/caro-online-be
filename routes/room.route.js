const router = require("express").Router();
const roomModel = require("../models/room.model");
const roomMemberModel = require("../models/room_member.model");
const cryptoRandomString = require("crypto-random-string");
const auth_jwt = require("../middlewares/auth.mdw")

router.post("/new-room", auth_jwt, async (req, res) => {
  const entity = req.body;
  const user = req.user;
  entity.join_code = cryptoRandomString({
    length: 8,
    type: "alphanumeric",
  });
  entity.owner = user.username;
  entity.next_user_turn = user.id;
  await roomModel
    .add(entity)
    .then((response) => {
      return res.json({
        code: 0,
        data: {
          id: response.insertId,
          join_code: entity.join_code,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      return res.json({
        code: 1,
        data: {
          message: "Fail to create new room!",
        },
      });
    });
});

router.get("/room-by-join-code", async (req, res) => {
  const entity = req.query;
  console.log(req.query);
  const rows = await roomModel.loadByJoinCode(entity.join_code);
  if (rows) {
    return res.json({
      code: 0,
      data: {
        room_id: rows.id,
      },
    });
  }

  return res.json({
    code: 1,
    data: {
      message: "No room !",
    },
  });
});

//user send their play
router.post("/play", auth_jwt, async (req, res) => {
  let next_user_turn = 0;
  const user = req.user;
  console.log(req.body.room_id);
  const members = await roomMemberModel.loadByRoomId(req.body.room_id);
  console.log(members);
  members.forEach((m) => {
    if (m.user_id !== user.id) next_user_turn = m.user_id;
  });
  await roomModel.changeHistory(
    req.body.room_id,
    JSON.stringify(req.body.data),
    next_user_turn
  );
  return res.json({
    code: 0,
  });
});

//user get game board
router.get("/play", async (req, res) => {
  console.log(req.query);
  const rows = await roomModel.loadById(req.query.room_id);
  console.log(rows[0].history);
  res.json({
    code: 0,
    data: rows[0].history,
  });
});

//user check their turn
router.post("/turn", auth_jwt, async (req, res) => {
  const user = req.user;
  const room = await roomModel.loadById(req.body.room_id);
  console.log(user.id);
  console.log(room[0].next_user_turn);
  const goFirst = user.username === room[0].owner;
  if (user.id === room[0].next_user_turn)
    return res.json({
      code: 0,
      goFirst,
    });
  else {
    return res.json({
      code: 1,
      goFirst,
    });
  }
});

module.exports = router;
