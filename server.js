"use strict";

const express = require('express');
const app = express();
const morgan = require('morgan');

const db = require('./config/db');
const IgdbAPI = require('./IgdbAPI');

// disallows Express detection
app.disable('x-powered-by');

// enables request logging
app.use(morgan('dev'));

app.use(function(req, res, next) {
  // ENABLE CORS FOR ALL REQUESTS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.get('/', function(req, res) {
  res.status(200).json({ "message": "hello world" });
});

app.get('/api/v1/search/:game', function(req, res) {
  IgdbAPI.gamesSearch(req, res);
});

const server = app.listen(3000, function() {
  const port = server.address().port;
  console.log('listening @ localhost:' + port);
});
