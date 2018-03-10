"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const eventSchema = new mongoose.Schema({
  // TODO: reevaluate whether these all need to be strings
  actor: {
    id:       String,
    username: String,
  },
  target: {
    obj: String,
    id:   String,
    name: String
  },
  type: String
});

module.exports = mongoose.model('Event', eventSchema);
