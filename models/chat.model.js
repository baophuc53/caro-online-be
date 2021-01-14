const db = require("../utils/db");

module.exports = {
    add: (entity) => db.add("chat", entity),
    loadByRoom: (roomId) => db.load("SELECT * FROM chat WHERE room_id = ?", roomId),
    loadChat: (id) => db.load("SELECT user.username, chat.time_stamp, chat.chat_content FROM chat INNER JOIN user ON chat.user_id = user.id WHERE room_id = ?", id),
}