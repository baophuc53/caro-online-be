const jwt = require('jsonwebtoken');
module.exports = {
    getUserFromToken: (token) => {
        const decoded = jwt.verify(token, "secret");
        return decoded.dat;
    },

    getIdFromToken: (token) => {
        const decoded = jwt.verify(token, "secret");
        return decoded.dat.id;
    }
}