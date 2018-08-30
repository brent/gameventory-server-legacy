"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const gameSchema = new mongoose.Schema({
  igdb_id:                  { type: Number, unique: true },
  igdb_name:                String,
  igdb_slug:                String,
  igdb_release_date:        String,
  igdb_summary:             String,
  igdb_first_release_date:  Number,
  igdb_release_dates:       [],
  igdb_developers:          [],
  igdb_publishers:          [],
  igdb_cover:               {},
  platforms:                [],
  release_dates:            [],
});

module.exports = mongoose.model('Game', gameSchema);
