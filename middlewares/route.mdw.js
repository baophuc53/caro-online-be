const userRoute = require("../routes/user.route");
const adminRoute = require("../routes/admin.route");
const roomRoute = require("../routes/room.route");
const restrict = require("../middlewares/auth.mdw");

module.exports = (app) => {
    app.use("/user", userRoute);
    app.use("/admin", adminRoute);
    app.use("/room", roomRoute);
}