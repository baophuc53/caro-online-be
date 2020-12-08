const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const session = require("express-session");
const logger = require("morgan");
const mdw = require("./middlewares/route.mdw");
const jwt = require("jsonwebtoken");
const sharedsession = require("express-socket.io-session");

const app = express();
<<<<<<< Updated upstream
app.use(cors({origin:"http://localhost:3001",credentials:true}));
=======
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  },
});
app.use(cors({origin:"http://localhost:3000",credentials:true}));
>>>>>>> Stashed changes
app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.urlencoded({ extended: true }));
<<<<<<< Updated upstream
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
mdw(app);

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let user = null;

app.use((req, res, next) => {
  if (req.session.token) {
    const decoded = jwt.verify(req.session.token, "secret");
    res.locals.user = decoded.dat;
    user = res.locals.user;
  }
  // res.locals.isLoggedIn = req.session.user ? true : false;
  console.log(user);
  next();
});

let socketArr = [];
io.on("connection", (socket) => {
  console.log("a user connected");
  console.log(io.of('/').clients);
  let tokenUser = user ? user : null;
  let userIDArray = [];
  // console.log(tokenUser);
  if (tokenUser) {
    tokenUser.socketID = socket.id;
    socketArr.push(tokenUser);
    for (let i in socketArr) {
      userIDArray.push({
        username: socketArr[i].username,
        nickname: socketArr[i].nickname,
        socketID: socketArr[i].socketID,
      });
    }
    console.log(userIDArray);
    io.sockets.emit("send-online-user-list", userIDArray);
  }
  socket.on("disconnect", () => {
    let usernameDisconnect = [];
    console.log("user disconnected");
    if (socketArr.length > 0) {
      for (let i in socketArr) {
        if (socketArr[i].socketID == socket.id) {
          socketArr.splice(i, 1);
          break;
        }
      }
    }
    for (let i in userIDArray) {
      if (userIDArray[i].socketID == socket.id) {
        usernameDisconnect.push(userIDArray[i]);
        break;
      }
    }
    io.sockets.emit("a user offline", usernameDisconnect);
=======
app.use(bodyParser.urlencoded({extended:true}));
const _session = session({ 
  secret: "keyboard cat", 
  resave: false, 
  saveUninitialized: true, 
})
app.use(_session);
io.use(sharedsession(_session));

let user;
app.use((req, res, next) => {
  if (req.session.token) {
    const decoded = jwt.verify(req.session.token, "secret");
    user = decoded.dat;
  }
  // res.locals.isLoggedIn = req.session.user ? true : false;
  // console.log(user);
  next();
});

let socketArr = [];

io.on("connection", (socket) => {
  console.log("a user connected");
  // console.log(socket.handshake.sessionStore.sessions);
  let tokenUser = user ? user : null;
  if (tokenUser) {
    tokenUser.socketID = socket.id;
    socketArr.push(tokenUser);
    // console.log(socketArr);
    io.sockets.emit("send-online-user-list", socketArr);
  }
  socket.on("disconnect", () => {
    console.log("--------------user disconnected----------------------");
    // console.log(socket.id);
    if (socketArr.length > 0) {
      for (let i in socketArr) {
        // console.log(socketArr[i].socketID);
        if (socketArr[i].socketID == socket.id) {
          socketArr.splice(i, 1);
          break;
        }
      }
    }
    io.sockets.emit("send-online-user-list", socketArr);
  });
});

mdw(app);

server.listen(process.env.PORT || 8000, () => {
    console.log("Web server running at http://localhost:8000");
>>>>>>> Stashed changes
  });
});

server.listen(process.env.PORT || 8000, () => {
  console.log("Web server running at http://localhost:8000");
});

module.exports = app;
