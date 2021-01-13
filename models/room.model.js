const db = require("../utils/db");

module.exports = {
    loadAllWaiting: async (username) => {
        const data = await db.load(`SELECT room.id, name_room, nickname FROM user INNER JOIN room 
                                        ON user.username = room.owner WHERE room.status = "waiting" 
                                        AND private IS FALSE AND owner != ?`, username);
        return data;
    },
    
    loadAllPlaying: async (username) => {
        const data = await db.load(`SELECT room.id, name_room, nickname FROM user INNER JOIN room 
                                        ON user.username = room.owner WHERE room.status = "online" 
                                        AND private IS FALSE AND owner != ?`, username);
        return data;
    },

    loadAllByUser: async (userId) => {
        const data = await db.load(`SELECT room.id, name_room, owner, time, user.nickname as winner, 
                                    DATE_FORMAT(room.create_at,"%d-%m-%Y %r") as create_at
                                    FROM user, room INNER JOIN room_member ON room.id = room_member.room_id
                                    WHERE room_member.user_id = ? AND room.winner = user.id`, userId)
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