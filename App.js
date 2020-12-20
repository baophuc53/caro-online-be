const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const logger = require("morgan");
const mdw = require("./middlewares/route.mdw");
const jwt = require("jsonwebtoken");
const config = require("./config/config.json");
const roomMemberModel = require("./models/room_member.model");
const passport = require("passport");
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

let socketArr = [];

let UserID;
let roomID;
io.on("connection", (socket) => {
  console.log("a user connected: " + socket.id);
  socket.on("token", (data) => {
    const decoded = jwt.verify(data, "secret");
    user = decoded.dat;
    // console.log(user);
    let tokenUser = user ? user : null;
    if (tokenUser) {
      let exist = 1;
      UserID = tokenUser;
      if (socketArr.length > 0) {
        for (let i in socketArr) {
          if (socketArr[i].id == tokenUser.id) {
            socketArr[i].exist = socketArr[i].exist + 1;
            socketArr[i].socketID.push(socket.id);
            exist = socketArr[i].exist;
            break;
          }
        }
      }
      if (exist == 1) {
        tokenUser.socketID = [socket.id];
        tokenUser.exist = exist;
        socketArr.push(tokenUser);
      }
    }
    console.log(socketArr);
    io.emit("send-online-user-list", socketArr);
  });
  
  socket.on("room", (room) => {
    console.log("room id la", room);
    roomID= room;
    socket.join(room);
  });

  socket.on("send-chat-message", (data) => {
    console.log("send-chat-message ", data);
    socket.broadcast.to(roomID).emit("chat-message", data);
  });

  socket.on("swap-turn", async (room) => {
    console.log(socket.id);
    console.log(room);
    const members = await roomMemberModel.loadByRoomId(room);
    members.forEach((m) => {
      const user = socketArr.filter((s) => s.id === m.user_id);
      // console.log(user[0]);
      if (user && !user[0].socketID.includes(socket.id)) {
        console.log(user[0].id);
        user[0].socketID.forEach((s) => {
          console.log(s);
          io.to(s).emit("get-turn", room)
        });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected: " + socket.id);
    if (socketArr.length > 0) {
      for (let i in socketArr) {
        let list_socket_id = socketArr[i].socketID;
        if (list_socket_id.length > 1) {
          for (let j in list_socket_id) {
            if (list_socket_id[j] == socket.id) {
              list_socket_id.splice(j, 1);
              socketArr[i].exist = socketArr[i].exist - 1;
              console.log("da giam trong list");
              break;
            }
          }
        } else if (list_socket_id[0] == socket.id) {
          socketArr.splice(i, 1);
          console.log("da xoa ra khoi list");
          break;
        }
      }
    }
    io.emit("send-online-user-list", socketArr);
  });
});

mdw(app);

server.listen(process.env.PORT || 8000, () => {
  console.log("Web server running at http://localhost:8000");
});

module.exports = app;
