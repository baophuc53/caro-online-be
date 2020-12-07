const db = require("../utils/db");

module.exports = {
    loadByUserName: async (userName) => {
        const row = await db.load("SELECT * FROM admin WHERE username = ?", userName);
        return row[0];
    },

    loadById: async (id) => {
        const row = await db.load("SELECT * FROM admin WHERE id = ?", id)
    },

    add: (entity) => db.add("admin", entity)

}