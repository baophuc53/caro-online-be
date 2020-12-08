const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const logger = require("morgan");
const mdw = require("./middlewares/route.mdw");
const jwt = require("jsonwebtoken");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
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

let user;

app.post("/", (req, res) => {
  const token = req.body.token;
  if (token) {
    const decoded = jwt.verify(req.session.token, "secret");
    user = decoded.dat;
  }
  console.log(user);
});

let socketArr = [];

io.on("connection", (socket) => {
  console.log("a user connected");
  let tokenUser = user ? user : null;
  if (tokenUser) {
    let exist = 1;
    if (socketArr.length > 0) {
      for (let i in socketArr) {
        if (socketArr[i].id == tokenUser.id) {
          socketArr[i].exist = socketArr[i].exist + 1;
          exist = socketArr[i].exist;
          break;
        }
      }
    }
    if (exist == 1) {
      tokenUser.socketID = socket.id;
      tokenUser.exist = exist;
      socketArr.push(tokenUser);
    }
    console.log(socketArr);
    io.sockets.emit("send-online-user-list", socketArr);
  }
  socket.on("disconnect", () => {
    console.log("--------------user disconnected----------------------");
    console.log(socket.id);
    if (socketArr.length > 0) {
      for (let i in socketArr) {
        console.log(socketArr[i].socketID);
        if (socketArr[i].socketID == socket.id) {
          if (socketArr[i].exist == 1){
          socketArr.splice(i, 1);
          break;
          }
          else{
            socketArr[i].exist = socketArr[i].exist - 1;
          }
        }
      }
    }
    io.sockets.emit("send-online-user-list", socketArr);
  });
});

mdw(app);

server.listen(process.env.PORT || 8000, () => {
  console.log("Web server running at http://localhost:8000");
});

module.exports = app;
