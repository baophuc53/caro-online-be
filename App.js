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
const userModel = require("./models/user.model");
require("./passport");
require("express-async-errors");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: '*',
  },
});
app.use(cors());
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
let quickPlayArr = [];
io.on("connection", (socket) => {
  console.log("a user connected: " + socket.id);

  socket.on("token", (data) => {
    user = helper.getUserFromToken(data);
    const checkUser = userArr.filter((x) => x.nickname === user.nickname);
    if (user) {
      if (checkUser.length === 0) userArr.push({id: user.id, nickname: user.nickname });
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

  socket.on("invite", (inviteName) => {
    console.log("onInvite");
    const inviteUser = userArr.find((x) => x.nickname === inviteName);
    if (inviteUser) {
      const inviteSocket = socketMap.get(inviteUser.id);
      const room = roomMap.get(socket.id);
      const user = userMap.get(socket.id);
      if (room && user)
        io.to(inviteSocket).emit("invite-noti", {nickname: user.nickname, room});
    }
  })

  socket.on("quick-play", async (message) => {
    console.log(quickPlayArr);
    if (quickPlayArr.length === 0)
      quickPlayArr.push(userMap.get(socket.id));
    else {
      const user1 = userMap.get(socket.id);
      const user2 = quickPlayArr.splice(0, 1);
      const roomId = await helper.createQuickRoom(user1, user2[0]);
      console.log("quick play: " + roomId);
      if (roomId > 0) {
        io.to(socketMap.get(user1.id)).emit("matched", roomId);
        io.to(socketMap.get(user2[0].id)).emit("matched", roomId);
      }
    }
  })

  socket.on("cancel-quick-play", (messgae) => {
    console.log("cancel-quick-play");
    console.log(quickPlayArr);
    const user = userMap.get(socket.id);
    const index = quickPlayArr.findIndex(x => x.id === user.id);
    if (index >= 0)
      quickPlayArr.splice(index, 1);
    console.log(quickPlayArr);
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
      if (socket_m && socket_m !== socket.id) {
        io.to(socket_m).emit("get-turn", "continue");
        socket.broadcast.to(roomMap.get(socket.id)).emit("update-board", "continue");
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
          const user = await userModel.loadById(m.user_id);
          await userModel.editById({id: user.id, won: user.won + 1});
          io.to(socket_m).emit("get-turn", "win");
        }
      }
    });
    socket.broadcast.to(roomMap.get(socket.id)).emit("update-board", "end");
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

// app.use((req, res, next, err) => {
//   console.log(err);
//   if (isNaN(err.code)) err = { code: 1, data: { message: "Internal error" } };
//   res.json(err);
// });

server.listen(process.env.PORT || 8000, () => {
  console.log("Web server running at http://localhost:8000");
});

module.exports = app;
