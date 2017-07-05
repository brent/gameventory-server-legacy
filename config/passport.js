"use strict";

const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const jwt = require('jsonwebtoken');

module.exports = function(passport) {
  passport.use('signup', new LocalStrategy({
    usernameField:     'username',
    passwordField:     'password',
    passReqToCallback: true
  }, function(req, username, password, done) {
    User.findOne({ 'username': username }, function(err, user) {
      if (err) { return done(err); }

      if (user) { 
        req.success = false;
        req.message = 'user already exists';
        return done(null, { user: null });
      }

      const newUser = new User();
      newUser.username = username;
      newUser.password = password;

      newUser.save(function (err) {
        if (err) { throw err; }

        req.success = true;
        req.message = 'user created successfully';

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);
        req.token = token;

        return done(null, newUser);
      });
    });
  }));

  passport.use('login', new LocalStrategy({
    usernameField:     'username',
    passwordField:     'password',
    passReqToCallback: true
  }, function(req, username, password, done) {
    User.findOne({ 'username': username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { 
        req.success = false;
        req.message = 'user not found';
        return done(null, { user: null });
      }

      user.comparePassword(password)
        .then((res) => {
          if (res == true) {
            req.success = true;
            req.message = 'user found successfully; passwords match';

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            req.token = token;

            return done(null, user);
          } else {
            req.success = false;
            req.message = 'user found successfully; passwords do not match';
            return done(null, { user: null });
          }
        })
        .catch((error) => { console.log(error); });
    });
  }));
}
