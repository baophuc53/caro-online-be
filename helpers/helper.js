const jwt = require("jsonwebtoken");
const cryptoRandomString = require("crypto-random-string");
const roomModel = require("../models/room.model");
const roomMemberModel = require("../models/room_member.model");
const config = require("../config/config.json");
const { async } = require("crypto-random-string");
const userModel = require("../models/user.model");
const e = require("express");
module.exports = {
  getUserFromToken: (token) => {
    const decoded = jwt.verify(token, config.secret);
    return decoded.dat;
  },

  getIdFromToken: (token) => {
    const decoded = jwt.verify(token, config.secret);
    return decoded.dat.id;
  },

  calculateWinner: (square, move) => {
    const row = Math.floor(move / 20);
    let count = 1;
    let temp = move;
    //check row
    while (
      temp > 0 &&
      Math.floor((temp - 1) / 20) === row &&
      square[move] === square[temp - 1]
    ) {
      count++;
      temp--;
    }
    temp = move;
    while (
      Math.floor((temp + 1) / 20) === row &&
      square[move] === square[temp + 1]
    ) {
      count++;
      temp++;
    }
    console.log("row: " + count);
    if (count >= 5) return true;

    //check col
    temp = move;
    count = 1;
    while (temp > 19 && square[move] === square[temp - 20]) {
      count++;
      temp = temp - 20;
    }
    temp = move;
    while (temp < 380 && square[move] === square[temp + 20]) {
      count++;
      temp = temp + 20;
    }
    console.log("col: " + count);
    if (count >= 5) return true;

    //check diag
    temp = move;
    count = 1;
    while (
      temp > 19 &&
      temp % 20 !== 19 &&
      square[move] === square[temp - 19]
    ) {
      count++;
      temp = temp - 19;
    }
    temp = move;
    while (
      temp < 380 &&
      temp % 20 !== 0 &&
      square[move] === square[temp + 19]
    ) {
      count++;
      temp = temp + 19;
    }
    console.log("diag: " + count);
    if (count >= 5) return true;

    //check anti-diag
    temp = move;
    count = 1;
    while (temp > 20 && temp % 20 !== 0 && square[move] === square[temp - 21]) {
      count++;
      temp = temp - 21;
    }
    temp = move;
    while (
      temp < 379 &&
      temp % 20 !== 19 &&
      square[move] === square[temp + 21]
    ) {
      count++;
      temp = temp + 21;
    }
    console.log("anti-diag:" + count);
    if (count >= 5) return true;

    return false;
  },

  createQuickRoom: async (user1, user2) => {
    let roomId = -1;
    const join_code = cryptoRandomString({
      length: 8,
      type: "alphanumeric",
    });
    const entity = {
      name_room: "Quick play " + user1.nickname + " " + user2.nickname,
      join_code,
      private: false,
      time: 20,
      owner: user1.username,
      next_user_turn: user1.id,
      status: "online"
    };
    await roomModel
    .add(entity)
    .then( async (response) => {
      await roomMemberModel.add({room_id: response.insertId, user_id: user1.id});
      await roomMemberModel.add({room_id: response.insertId, user_id: user2.id});
      roomId = response.insertId;
    })
    .catch((err) => {
      console.log(err);
      roomId = -1;
    });
    return roomId;
  },

};
