"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const gameventorySchema = new mongoose.Schema({
  user: { 
    id : { type: String, unique: true },
    username: { type: String, unique: true }
  },
  games: {
    nowPlaying: [],
    upNext: [],
    onIce: [],
    finished: [],
    abandoned: []
  }
});

module.exports = mongoose.model('Gameventory', gameventorySchema);
