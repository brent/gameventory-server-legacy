"use strict"

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const platformSchema = new mongoose.Schema({
  igdb_id: { type: Number, unique: true },
  igdb_name: String,
  igdb_alternative_name: String
});

module.exports = mongoose.model('Platform', platformSchema);
