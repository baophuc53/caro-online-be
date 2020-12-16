const db = require("../utils/db");

module.exports = {

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
        db.patch("room", {history, next_user_turn}, condition);
    }


}