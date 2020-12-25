const db = require("../utils/db");

module.exports = {
    loadAllPlaying: async (username) => {
        const data = await db.load(`SELECT room.id, name_room, nickname FROM user INNER JOIN room 
                                        ON user.username = room.owner WHERE status = "waiting" AND owner != ?`, username);
        return data;
    },
    loadById: async (id) => await db.load("SELECT * FROM room WHERE id = ?", id),
    loadByJoinCode: async(join_code) => {
        const rows = await db.load(`SELECT * FROM room WHERE join_code = ?`, join_code);
        if (rows.lenght === 0)
            return null;
        return rows[0];
    },
    add: (entity) => db.add("room", entity),

    changeHistory: (id, history, next_user_turn) => {
        const condition = { id };
        return db.patch("room", {history, next_user_turn}, condition);
    },

    setWinner: (id, winner) => {
        const condition = { id };
        return db.patch("room", {winner}, condition);
    },

    setOffline: (id) => {
        const condition = { id };
        return db.patch("room", {status: "offline"}, condition);
    },

    setOnline: (id) => {
        const condition = { id };
        return db.patch("room", {status: "online"}, condition);
    }


}