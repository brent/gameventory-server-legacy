"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const eventSchema = new mongoose.Schema({
  // TODO: reevaluate whether these all need to be strings
  actor: String,
  actorUsername: String,
  target: String,
  type: String,
  message: String
});

module.exports = mongoose.model('Event', eventSchema);
