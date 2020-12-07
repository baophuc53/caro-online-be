const router = require("express").Router();
const adminModel = require("../models/admin.model")
const bcrypt = require("bcrypt");

//login
router.post("/", async (req, res) => {
    const { username, password } = req.body;
    const dat = await adminModel.loadByUserName(username);
    if (dat && await bcrypt.compare(password, dat.password)) {
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
    };
});

//register
router.put("/", async (req, res) => {
    const entity = req.body;
    bcrypt.hash(entity.password, 10).then( async (hash) => {
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

module.exports = router;