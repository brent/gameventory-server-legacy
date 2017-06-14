"use strict";

const IgdbAPI   = require('../igdbapi');
const isLoggedIn = require('../routes/helpers').isLoggedIn;
const Gameventory = require('../models/gameventory');
const User = require('../models/user');

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
    }
  );

  app.get('/api/v1/users',
    isLoggedIn,
    function(req, res) {
      User.find({ username: { $regex: req.query.q } }, function (err, users) {
        if (err) {
          res.status(200).json({
            success: false,
            message: "problem with mongo"
          });
          console.log(err);
        }

        if (users) {
          res.status(200).json({
            success: true,
            users: users
          });
        } else {
          res.status(200).json({
            success: false,
            message: "no users found"
          });
        }
      });
    }
  );

  app.get('/api/v1/users/:username',
    isLoggedIn,
    function (req, res) {
      Gameventory.find({ 'user.username': req.params.username }, function (err, gameventory) {
        if (err) {
          res.status(200).json({
            success: false,
            message: "mongodb error",
            error: err
          });
        }

        if (gameventory) {
          res.status(200).json({
            success: true,
            gameventory: gameventory
          });
        } else {
          res.status(200).json({
            success: false,
            message: "couldn't find gameventory for user"
          });
        }
      });
    }
  );

  app.get('/api/v1/fetchPlatforms/:offset', function (req, res) {
    IgdbAPI.getRemotePlatforms(req, res);
  });

  app.post('/api/v1/signup', 
    passport.authenticate('signup', { session: false }),
    function (req, res) {
      res.status(200).json({
        success:   req.success,
        message:   req.message,
        userId:    req.userId,
        username:  req.username,
        token:     req.token
      }
    );
  });

  app.post('/api/v1/login',
    passport.authenticate('login', { session: false }),
    function (req, res) {
      res.status(200).json({
        success:   req.success,
        message:   req.message,
        userId:    req.userId,
        username:  req.username,
        token:     req.token
      }
    );
  });

  app.get('/api/v1/gameventory',
    isLoggedIn,
    function (req, res) {
      let userId = req.user._id;
      Gameventory.findOne({ "user.id": userId }, function (err, gameventory) {
        if (err) {
          res.status(200).json({
            success: false,
            message: "problem with mongo"
          });
          console.log(err);
        }

        if (gameventory) {
          res.status(200).json({
            success: true,
            games: gameventory.games
          });
        } else {
          res.status(200).json({
            success: false,
            message: "gameventory not found"
          });
        }
      });
    }
  );

  app.post('/api/v1/gameventory',
    isLoggedIn,
    function (req, res) {
      let userId = req.body.user.id;
      Gameventory.findOne({ "user.id": userId }, function (err, gameventory) {
        if (err) {
          res.status(200).json({
            success: false,
            message: "problem with mongo"
          });
        }

        if (gameventory) {
          gameventory.games = req.body.games;
          gameventory.save(function (err, updatedGameventory) {
            if (err) {
              res.status(200).json({
                success: false,
                message: "problem with mongo"
              });
            }

            if (updatedGameventory) {
              res.status(200).json({
                success: true,
                message: "gameventory updated successfully",
                games: updatedGameventory.games
              });
            } else {
              res.status(200).json({
                success: false,
                message: "gameventory could not be updated"
              });
            }
          });
        } else {
          let newGameventory = new Gameventory();
          newGameventory.user = req.body.user;
          newGameventory.games = req.body.games;

          newGameventory.save(function (err, newGameventory) {
            if (err) {
              res.status(200).json({
                success: false,
                message: "problem with mongo"
              });
            }

            if (newGameventory) {
              res.status(200).json({
                success: true,
                message: "gameventory saved successfully",
                games: newGameventory.games
              });
            } else {
              res.status(200).json({
                success: false,
                message: "gameventory could not be saved"
              });
            }
          });
        }
      });
    }
  );
};
