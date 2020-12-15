const db = require("../utils/db");

module.exports = {

    add: (entity) => db.add("room_member", entity),
    loadByRoomId: (id) => db.load(`select user_id from room_member where room_id = ?`, id)

}