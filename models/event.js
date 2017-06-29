"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const eventSchema = new mongoose.Schema({
  actor: String,
  target: String,
  type: String,
  message: String
});

module.exports = mongoose.model('Event', eventSchema);
