"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  //email:    { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  games: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  gameventory: { type: mongoose.Schema.ObjectId, unique: true }
});

userSchema.pre('save', function (next) {
  if (!this.password) { throw Error('user has no password'); }
  this.generateHash(this.password)
    .then((hash) => {
      this.password = hash;
      next();
    })
    .catch((error) => {
      throw error;
    });
});

const saltRounds = 10;

userSchema.methods.generateHash = function (password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        if (err) { 
          reject(err); 
        } else {
          resolve(hash);
        }
      })
    });
  });
};

userSchema.methods.comparePassword = function (password) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, this.password, function (err, res) {
      if (res == true) {
        resolve(true);
      } else if (res == false) {
        resolve(false);
      } else {
        reject(Error('could not compare passwords'));
      }
    });
  });
};

module.exports = mongoose.model('User', userSchema);
