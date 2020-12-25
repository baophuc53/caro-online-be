const jwt = require('jsonwebtoken');
module.exports = {
    getUserFromToken: (token) => {
        const decoded = jwt.verify(token, "secret");
        return decoded.dat;
    },

    getIdFromToken: (token) => {
        const decoded = jwt.verify(token, "secret");
        return decoded.dat.id;
    },

    calculateWinner: (square, move) => {
        const row = Math.floor(move / 20);
        let count = 1;
        let temp = move;
        //check row
        while (temp > 0 && Math.floor((temp-1)/20) === row && square[move] === square[temp-1]) {
            count++;
            temp--;
        }
        temp = move;
        while (Math.floor((temp+1)/20) === row && square[move] === square[temp+1]) {
            count++;
            temp++;
        }
        console.log("row: "+count);
        if (count >= 5) 
            return true; 
        
        //check col
        temp = move;
        count = 1;
        while (temp > 19 && square[move] === square[temp-20]) {
            count++;
            temp = temp - 20;
        }
        temp = move;
        while (temp < 380 && square[move] === square[temp + 20]) {
            count++;
            temp = temp + 20;
        }
        console.log("col: "+count);
        if (count >= 5)
            return true;
        
        //check diag
        temp = move;
        count = 1;
        while (temp > 19 && temp%20 !== 19 && square[move] === square[temp - 19]) {
            count++;
            temp = temp - 19;
        }
        temp = move;
        while (temp < 380 && temp%20 !== 0 && square[move] === square[temp + 19]){
            count++;
            temp = temp + 19;
        }
        console.log("diag: "+count);
        if (count >= 5) 
            return true;

        //check anti-diag
        temp = move;
        count = 1;
        while (temp > 20 && temp%20 !== 0 && square[move] === square[temp - 21]) {
            count++;
            temp = temp - 21;
        }
        temp = move;
        while (temp < 379 && temp%20 !== 19 && square[move] === square[temp + 21]) {
            count++;
            temp = temp + 21;
        }
        console.log("anti-diag:" + count);
        if (count >= 5) 
            return true;

        return false;
    }
}