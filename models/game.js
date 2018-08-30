"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const gameSchema = new mongoose.Schema({
  igdb_id:                      { type: Number, unique: true },
  igdb_name:                    String,
  igdb_slug:                    String,
  igdb_release_date:            String,
  igdb_summary:                 String,
  igdb_first_release_date:      Number,
  igdb_release_dates:           [],
  igdb_developers:              [],
  igdb_publishers:              [],
  igdb_cover:                   {},
  igdb_platforms:               [],
  igdb_category:                Number,
  igdb_time_to_beat:            {},
  igdb_game_modes:              [],
  igdb_themes:                  [],
  igdb_genres:                  [],
  igdb_status:                  [],
  igdb_alternative_name:        String,
  igdb_screenshots:             [],
  igdb_videos:                  [],
  igdb_esrb:                    {},
  igdb_pegi:                    {},
  igdb_websites:                [],
  igdb_dlcs:                    [],
  igdb_expansions:              [],
  igdb_standalone_expansions:   [],
  igdb_bundles:                 [],
  igdb_games:                   [],
  igdb_artworks:                [],
  igdb_aggregated_rating:       Number,
  platforms:                    [],
  release_dates:                [],
});

module.exports = mongoose.model('Game', gameSchema);
