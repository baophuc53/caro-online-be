const { async } = require("crypto-random-string");
const db = require("../utils/db");

module.exports = {
  loadByUserName: async (userName) => {
    const row = await db.load(
      "SELECT * FROM user WHERE username = ?",
      userName
    );
    return row[0];
  },

  loadById: async (id) => {
    const row = await db.load("SELECT * FROM user WHERE id = ?", id);
    return row[0];
  },

  loadByEmail: async (email) => {
    const row = await db.load("SELECT * FROM user WHERE email = ?", email);
    return row[0];
  },

  add: (entity) => db.add("user", entity),

  editById: (entity) => {
    const condition = { id: entity.id };
    delete entity.id;
    return db.patch("user", entity, condition);
  },

  editByEmail: (entity) => {
    const condition = { email: entity.email };
    delete entity.email;
    return db.patch("user", entity, condition);
  },

  loadByOpenId: ({ openId, platform }) =>
    db
      .load(`SELECT * FROM user WHERE platform=? AND open_id=?`, [
        platform,
        openId,
      ])
      .then((res) => res[0]),

  topRank: async () => {
    const toprank = await db.load(`SELECT * FROM user ORDER BY user.rank DESC LIMIT 10 OFFSET 0`);
    return toprank;
  },
};
