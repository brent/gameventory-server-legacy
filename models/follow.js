"use strict";

const _ = require('lodash');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const followSchema = new mongoose.Schema({
  uid: mongoose.Schema.ObjectId,
  fid: mongoose.Schema.ObjectId,
  fUsername: String,
  uUsername: String
});

followSchema.index({ "uid": 1, "fid": 1 }, { unique: true });

followSchema.statics.isUserFollowingOther = function(username, otherUsername) {
  return new Promise((resolve, reject) => {
    this.findOne({ 'uUsername': username, 'fUsername': otherUsername }, function(err, result) {
      if (err) {
        reject(Error('Could not find follow relationship'));
      }

      result ? resolve(true) : resolve(false);
    });
  });
};

module.exports = mongoose.model('Follow', followSchema);
