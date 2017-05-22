"use strict";

require('dotenv').config();

const express     = require('express');
const app         = express();
const morgan      = require('morgan');
const passport    = require('passport');
const db          = require('./config/db');
const bodyParser  = require('body-parser');

// passport strategies
require('./config/passport')(passport);

// disallows Express detection
app.disable('x-powered-by');

// enables request logging
app.use(morgan('dev'));

// allow express to parse request body
app.use(bodyParser.urlencoded({ extended: false }));

// ... initialize passport
app.use(passport.initialize());

// pass in app and passport to routes
require('./routes')(app, passport);

const server = app.listen(3000, function() {
  const port = server.address().port;
  console.log('listening @ localhost:' + port);
});
