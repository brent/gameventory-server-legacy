"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const followSchema = new mongoose.Schema({
  uid: mongoose.Schema.ObjectId,
  fid: mongoose.Schema.ObjectId,
  fUsername: String,
  uUsername: String
});

followSchema.index({ "uid": 1, "fid": 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
