"use strict";

const axios = require('axios');
const db = require('../config/db');
const IgdbAPI = require('../IgdbAPI');

try {
  IgdbAPI.getRemotePlatforms(0);
  console.log('remote platforms executed');
}
catch (e) {
  console.log(e);
}
