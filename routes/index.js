"use strict";

const IgdbAPI   = require('../igdbapi');
const isLoggedIn = require('../routes/helpers').isLoggedIn;

module.exports = function(app, passport) {
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

  app.get('/api/v1/search/:game', 
    isLoggedIn,
    function(req, res) {
    IgdbAPI.gamesSearch(req, res);
  });

  app.get('/api/v1/fetchPlatforms/:offset', function (req, res) {
    IgdbAPI.getRemotePlatforms(req, res);
  });

  app.post('/api/v1/signup', 
    passport.authenticate('signup', { session: false }),
    function (req, res) {
    res.status(200).json({
      success:   req.success,
      message:   req.message,
      token:     req.token
    });
  });

  app.post('/api/v1/login',
    passport.authenticate('login', { session: false }),
    function (req, res) {
    res.status(200).json({
      success:   req.success,
      message:   req.message,
      token:     req.token
    });
  });
};
