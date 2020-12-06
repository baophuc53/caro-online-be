const jwt = require('jsonwebtoken');
module.exports = {
    getIdFromToken: (token) => {
        const dat = jwt.verify(token, 'secret');
        return dat.id;
    }
}