const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const logger = require("morgan");
const mdw = require("./middlewares/route.mdw");
const config = require("./config/config.json");
const roomMemberModel = require("./models/room_member.model");
const helper = require("./helpers/helper");
const passport = require("passport");
const roomModel = require("./models/room.model");
require("./passport");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: config.dev.path,
    credentials: true,
  },
});
app.use(cors({ origin: config.dev.path, credentials: true }));
app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
const _session = session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
});
app.use(_session);
app.use(passport.initialize());

let user;

let userArr = [];
let socketMap = new Map();
let userMap = new Map();
let roomMap = new Map();
io.on("connection", (socket) => {
  console.log("a user connected: " + socket.id);
  socket.on("token", (data) => {
    user = helper.getUserFromToken(data);
    const checkUser = userArr.filter((x) => x.nickname === user.nickname);
    if (user) {
      if (checkUser.length === 0) userArr.push({ nickname: user.nickname });
      socketMap.set(user.id, socket.id);
      userMap.set(socket.id, user);
    }
    console.log(userArr);
    io.emit("send-online-user-list", userArr);
  });

  socket.on("room", (room) => {
    console.log("room id la", room);
    roomMap.set(socket.id, room);
    socket.join(room);
  });

  socket.on("join-room", async (room) => {
    const members = await roomMemberModel.loadByRoomId(room);
    members.forEach( async (m) => {
      const socket_m = socketMap.get(m.user_id);
      if (socket_m && socket_m!==socket.id) {
        io.to(socket_m).emit("end-waiting", room);
        await roomModel.setOnline(room);
        socket.emit("end-waiting", room);
      }
    });
  })

  socket.on("send-chat-message", (data) => {
    console.log("send-chat-message ", data);
    socket.broadcast.to(roomMap.get(socket.id)).emit("chat-message", data);
  });

  socket.on("swap-turn", async (room) => {
    console.log(socket.id);
    console.log(room);
    const members = await roomMemberModel.loadByRoomId(room);
    members.forEach((m) => {
      const socket_m = socketMap.get(m.user_id);
      if (socket_m && socket_m!==socket.id) {
        io.to(socket_m).emit("get-turn", "continue")
      }
    });
  });

  socket.on("end-game", async (message) => {
    const members = await roomMemberModel.loadByRoomId(roomMap.get(socket.id));
    members.forEach(async (m) => {
      const socket_m = socketMap.get(m.user_id);
      if (socket_m && socket_m!==socket.id) {
        if (message === "win")
          io.to(socket_m).emit("get-turn", "lose")
        else {
          await roomModel.setWinner(roomMap.get(socket.id), m.user_id);
          io.to(socket_m).emit("get-turn", "win");
        }
      }
    });
  })

  socket.on("disconnect", async () => {
    console.log("a user disconnected: " + socket.id);
    const user = userMap.get(socket.id);
    if (user) {
      const roomId = roomMap.get(socket.id);
      userArr.splice(userArr.findIndex(x => x.nickname === user.nickname), 1);
      userMap.delete(socket.id);
      roomMap.delete(socket.id);
      socketMap.delete(user.id);
      const room_members = [...roomMap].find(([key, val]) => val == roomId);
      if (!room_members) {
        roomModel.setOffline(roomId);
      }      
    }
    io.emit("send-online-user-list", userArr);
  });
});

mdw(app);

server.listen(process.env.PORT || 8000, () => {
  console.log("Web server running at http://localhost:8000");
});

module.exports = app;
