const db = require("../utils/db");

module.exports = {

    loadById: async (id) => {
        const row = await db.load("SELECT * FROM room WHERE id = ?", id)
    },

    add: (entity) => db.add("room", entity)

}