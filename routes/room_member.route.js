const router = require("express").Router();
const roomMemberModel = require("../models/room_member.model");
const passport = require("passport");

router.post("/join-room", async (req, res) => {
  passport.authenticate("jwt", { session: false }, async (err, user, info) => {
    console.log(user);
    if (err) {
      return res.json({
        code: 3,
        data: {
          message: "Something was wrong!",
        },
      });
    } else if (!user && info != undefined) {
      return res.json({
        code: 2,
        data: {
          message: "Not a valid user",
        },
      });
    } else {
      const entity = req.body;
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
    }
  })(req, res);
});

module.exports = router;
