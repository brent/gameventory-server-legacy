"use strict";

const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const Gameventory = require('../models/gameventory.js');

module.exports = function(passport) {
  passport.use('signup', new LocalStrategy({
    usernameField:     'username',
    passwordField:     'password',
    passReqToCallback: true
  }, function(req, username, password, done) {
    User.findOne({ 'username': username }, function(err, user) {
      if (err) { 
        req.success = false;
        req.message = "mongo error";
        return done(null, { user: null, gameventory: { } });
      }

      if (user) { 
        req.success = false;
        req.message = 'user already exists';
        return done(null, { user: null, gameventory: { } });
      }

      const newUser = new User();
      newUser.username = username;
      newUser.password = password;

      const newGameventory = new Gameventory();
      newGameventory.user.id = newUser.id;
      newGameventory.user.username = newUser.username;

      newUser.gameventory = newGameventory.id;

      newUser.save(function (err) {
        if (err) { throw err; }
        newGameventory.save(function (err) {
          if (err) {
            req.success = false;
            req.message = 'user created; gameventory could not be created';
          } else {
            req.success = true;
            req.message = 'user created successfully';

            const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);
            req.token = token;

            newUser.populate({ path: 'gameventory', model: 'Gameventory' }, function (err, populatedUser) {
              if (err) { return done(err); }
              if (!populatedUser) {
                req.success = false;
                req.message = 'user gameventory could not be populated';
                return done(null, { user: null, gameventory: { } });
              }

              return done(null, populatedUser);
            });
          }
        });
      });
    });
  }));

  passport.use('login', new LocalStrategy({
    usernameField:     'username',
    passwordField:     'password',
    passReqToCallback: true
  }, function(req, username, password, done) {
    User.findOne({ 'username': username }, function (err, user) {
      if (err) { 
        req.success = false;
        req.message = "mongo error";
        return done(null, { user: null });
      }

      if (!user) { 
        req.success = false;
        req.message = 'user not found';

        // TODO: fix this hacky response
        return done(null, { user: null, gameventory: { } });
      }

      user.comparePassword(password)
        .then((res) => {
          if (res == true) {
            req.success = true;
            req.message = 'user found successfully; passwords match';

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            req.token = token;

            user.populate({ path: 'gameventory', model: 'Gameventory' }, function (err, populatedUser) {
              if (err) { 
                req.success = false;
                req.message = "mongo error";
                return done(null, { user: null });
              }
              if (!populatedUser) {
                req.success = false;
                req.message = 'user gameventory could not be populated';
                return done(null, { user: null });
              }

              return done(null, populatedUser);
            });
          } else {
            req.success = false;
            req.message = 'user found; passwords do not match';
            return done(null, { user: null, gameventory: { } });
          }
        })
        .catch((error) => { console.log(error); });
    });
  }));
}
