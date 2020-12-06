const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const logger = require("morgan");
const mdw = require("./middlewares/route.mdw");

//app.use(cors({origin:"http://localhost:3000",credentials:true}));
app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({ 
    secret: "keyboard cat", 
    resave: false, 
    saveUninitialized: true, 
  })
);
mdw(app);

app.listen(process.env.PORT || 8000, () => {
    console.log("Web server running at http://localhost:8000");
  });

module.exports = app;

