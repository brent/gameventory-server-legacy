"use strict";

const User = require('../models/user');
const jwt = require('jsonwebtoken');

const routeHelpers = {
  isLoggedIn: function(req, res, next) {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: "you must log in"
      });
    }

    const token = req.headers.authorization.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err) { 
        return res.status(401).json({
          success: false,
          message: "error with token"
        }); 
      }

      const userId = decoded.userId;

      User.findOne({ '_id': userId }, function(err, user) {
        if (err) { 
          return res.status(401).json({
            success: false,
            message: "error finding user"
          });
        }

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "you must log in; user not found"
          });
        }

        req.user = user;
        return next();
      }).select('-password');
    });
  }
};

module.exports = routeHelpers;
