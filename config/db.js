"use strict";

const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1/gameventory', {
  user: process.env.DB_USER,
  pass: process.env.DB_PASS
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, "connection error:"));

db.once('open', function() {
  console.log("mongo connection successful");
});

db.on('close', function() {
  console.log("mongo connection closed");
});

module.exports = db;
