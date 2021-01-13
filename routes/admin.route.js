const router = require("express").Router();
const adminModel = require("../models/admin.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth_jwt = require("../middlewares/auth.mdw");

router.get("/user", auth_jwt, async (req, res) => {
  try {
    const rows = await adminModel.loadByUserName();

    return res.json({
      status: "SUCCESS",
      data: rows,
    });
  } catch (err) {
    return res.json({
      status: "FAIL",
      data: {
        message: "Something wrong!",
      },
    });
  }
});

router.get("/room", auth_jwt, async (req, res) => {
  try {
    const rows = await adminModel.loadRoom();

    return res.json({
      status: "SUCCESS",
      data: rows,
    });
  } catch (err) {
    return res.json({
      status: "FAIL",
      data: {
        message: "Something wrong!",
      },
    });
  }
});

router.get("/room/:id/chat", auth_jwt, async (req, res) => {
  try {
    const rows = await adminModel.loadChat(req.params.id);
    return res.json({
      status: "SUCCESS",
      data: rows,
    });
  } catch (err) {
    return res.json({
      status: "FAIL",
      data: {
        message: "Something wrong!",
      },
    });
  }
});

router.get("/room/user/:id", auth_jwt, async (req, res) => {
  const userId = req.params.id;
  
  try {
    const rows = await adminModel.loadRoomByUserId(userId);
    console.log("rows  ", rows);
    return res.json({
      status: "SUCCESS",
      data: rows,
    });
  } catch (err) {
    return res.json({
      status: "FAIL",
      data: {
        message: "Something wrong!",
      },
    });
  }
});

router.post("/search", auth_jwt, async (req, res) => {
  const { search } = req.body;
  console.log("search ", search);
  try {
    const rows = await adminModel.loadUserSearched(search);
    return res.json({
      status: "SUCCESS",
      data: rows,
    });
  } catch (err) {
    return res.json({
      status: "FAILED",
      data: {
        message: "Failed to search",
      },
    });
  }
});

//login
router.post("/", async (req, res) => {
  const { username, password } = req.body;
  const dat = await adminModel.loadByUserName(username);
  if (dat && (await bcrypt.compare(password, dat.password))) {
    const token = jwt.sign({ id: dat.id, username }, "secret");
    req.session.token = token;
    console.log(req.session);
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
    await adminModel
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


router.put("/block/user/:id", async (req, res) => {
  const entity = {
    status: "inactivated"
  }
  const condition = {
    id: req.params.id
  }
  try {
    await adminModel.blockUser(entity, condition);
    console.log("block");
    return res.json({
      status: "SUCCESS",
      data: {
        message: "Blocked User Successfully",
      },
    });
  } catch (err) {
    return res.json({
      status: "FAILED",
      data: {
        message: "Failed to block",
      },
    });
  }
});

module.exports = router;
