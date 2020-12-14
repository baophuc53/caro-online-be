const db = require("../utils/db");

module.exports = {

    add: (entity) => db.add("room_member", entity)

}