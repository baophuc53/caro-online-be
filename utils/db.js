const mysql = require("mysql2");
const util = require("util");
const config = require("../config/config.json");

const pool = mysql.createPool(config.mysql);
const query = util.promisify(pool.query).bind(pool);

module.exports = {
    load: query,
    add: (tableName, entity) => query(`INSERT INTO ${tableName} SET ? `, entity),
    del: (tableName, condition) => query(`DELETE FROM ${tableName} WHERE ?`, condition),
    patch: (tableName, entity, condition) => query(`UPDATE ${tableName} SET ? WHERE ?`, [entity, condition])
}