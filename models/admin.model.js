const { async } = require("crypto-random-string");
const db = require("../utils/db");

module.exports = {
  loadByUserName: async () => {
    const row = await db.load("SELECT * FROM user");
    return row;
  },
  loadUserSearched: async (search) => {
    const dataSearch = "%" + search + "%";
    const row = await db.load(
      "SELECT * FROM user WHERE username LIKE ? OR email LIKE ? ",
      [dataSearch, dataSearch]
    );
    return row;
  },
  loadRoom: async () => {
    const row = await db.load("SELECT * FROM room");
    return row;
  },
  loadRoomByUserId: async (userId) => {
    console.log("userId ", userId);
    const row = await db.load(
      "SELECT * FROM room INNER JOIN room_member ON room.id= room_member.room_id WHERE room_member.user_id = ?",
      userId
    );
    console.log("rowssss ", row);
    return row;
  },
  loadById: (id) =>
    db.load("SELECT * FROM admin WHERE id = ?", id).then((res) => res[0]),

  loadChat: (id) => db.load("SELECT user.username, chat.time_stamp, chat.chat_content FROM chat INNER JOIN user ON chat.user_id = user.id WHERE room_id = ?", id),

  blockUser: async (entity, condition) => {
    await db.patch("user", entity, condition);
    console.log("after");
  },

  add: (entity) => db.add("admin", entity),
};
