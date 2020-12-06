const db = require("../utils/db");

module.exports = {
    loadByUserName: async (userName) => {
        const row = await db.load("SELECT * FROM user WHERE username = ?", userName);
        return row[0];
    },

    loadById: async (id) => {
        const row = await db.load("SELECT * FROM user WHERE id = ?", id)
    },

    add: (entity) => db.add("user", entity)

}