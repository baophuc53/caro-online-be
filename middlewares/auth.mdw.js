
module.exports = (req, res, next) => {
    console.log(req.session);
    const token = req.session.token;
    if (
      req.headers.token
    ) {
      next();
    } else {
      res.json({
        code: 1,
        message: "Authorize fail!",
      });
    }
  };