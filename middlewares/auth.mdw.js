
module.exports = (req, res, next) => {
    console.log(req.session);
    const token = req.session.token;
    if (
      req.headers.authorization &&
      req.headers.authorization.replace("Bearer ", "") === token
    ) {
      next();
    } else {
      res.json({
        code: 1,
        message: "Authorize fail!",
      });
    }
  };