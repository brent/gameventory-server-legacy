"use strict";

const IgdbAPI   = require('../igdbapi');
const isLoggedIn = require('../routes/helpers').isLoggedIn;
const Gameventory = require('../models/gameventory');
const User = require('../models/user');
const Event = require('../models/event');
const Follow = require('../models/follow');

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
      const username = req.params.username;

      Follow.isUserFollowingOther(req.user.username, username)
        .then(function(isFollowed) {
          User
             .findOne({ username: username }, { password: 0 })
             .populate({
               path: 'gameventory',
               model: 'Gameventory'
             })
             .exec(function (err, user) {
               if (err) {
                 res.status(200).json({
                   success: false,
                   message: "mongodb error",
                   error: err
                 });
               }

               if (user) {
                 res.status(200).json({
                   success: true,
                   user: {
                     id: user.id,
                     username: user.username,
                     numFollowers: user.followers,
                     numFollowing: user.following,
                     numGames: user.games,
                     isFollowed: isFollowed
                   },
                   games: user.gameventory.games
                 });
               } else {
                 res.status(200).json({
                   success: false,
                   message: "couldn't find gameventory for user"
                 });
               }
             }
           );
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
        token:     req.token,
        user: {
          id: req.user.id,
          username: req.user.username,
          numFollowers: req.user.followers,
          numFollowing: req.user.following,
          numGames: req.user.games
        },
        games: req.user.gameventory.games
      });
    }
  );

  app.post('/api/v1/login',
    passport.authenticate('login', { session: false }),
    function (req, res) {
      res.status(200).json({
        success:   req.success,
        message:   req.message,
        token:     req.token,
        user: {
          id: req.user.id,
          username: req.user.username,
          numFollowers: req.user.followers,
          numFollowing: req.user.following,
          numGames: req.user.games
        },
        games: req.user.gameventory.games
      });
    }
  );

  app.get('/api/v1/gameventory',
    isLoggedIn,
    function (req, res) {
      let userId = req.user.id;
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
      let userId = req.user.id;
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
              if (req.body.event) {
                let event = new Event({
                  actor: req.body.event.actor,
                  target: req.body.event.target,
                  type: req.body.event.type,
                  message: req.body.event.message
                });

                event.save(function (err, savedEvent) {
                  if (err) { console.log('could not save event', event) }
                });
              }

              let gvGames = updatedGameventory.games;
              let numGames = gvGames.nowPlaying.length + gvGames.upNext.length + gvGames.onIce.length + gvGames.finished.length + gvGames.abandoned.length;

              User.findByIdAndUpdate(userId, { "games": numGames }, function (err, doc) {
                if (err) { console.log('could not update games count for', userId); }
              });

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
              if (req.body.event) {
                let event = new Event({
                  actor: req.body.event.actor,
                  target: req.body.event.target,
                  type: req.body.event.type,
                  message: req.body.event.message
                });

                event.save(function (err, savedEvent) {
                  if (err) { console.log('could not save event', event) }
                });
              }

              let gvGames = newGameventory.games;
              let numGames = gvGames.nowPlaying.length + gvGames.upNext.length + gvGames.onIce.length + gvGames.finished.length + gvGames.abandoned.length;

              User.findByIdAndUpdate(userId, { "games": numGames }, function (err, doc) {
                if (err) { console.log('could not update games count for', userId); }
              });

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

  app.get('/api/v1/feed', 
    isLoggedIn,
    function (req, res) {
      const uid = req.user.id;
      if (req.query.scope == "following") {
        Follow.find({ uid: uid }, function (err, follows) {
          if (err) {
            res.status(200).json({
              success: false,
              message: "problem with mongo"
            });
          }

          if (follows) {
            let followsArr = [];
            follows.forEach(function (follow) {
              followsArr.push(follow.fid);
            });

            Event.find({ $or:
                [ 
                  { 
                    $and: [ 
                      { type: { $regex: /FOLLOW/ } }, 
                      { target: { $in: followsArr }, actor: { $ne: uid } } 
                    ]
                  },
                  { 
                    $and: [
                      { type: { $regex: /GAME/ } },
                      { actor: { $ne: uid } }
                    ]
                  }
                ]
              }).sort( { $natural: -1 }).limit(100).exec(function (err, events) {
                if (err) {
                  res.status(200).json({
                    success: false,
                    message: "problem with mongo"
                  });
                }

                if (events) {
                  res.status(200).json({
                    success: true,
                    message: "events found",
                    events: events
                  });
                } else {
                  res.status(200).json({
                    success: false,
                    message: "events couldn't be found",
                  });
                }
              }
            );
          } else {
            res.status(200).json({
              success: false,
              message: "user has no followers"
            });
          }
        });
      } else {
        Event.find({}).sort({ $natural: -1 }).limit(100).exec(function (err, events) {
          if (err) {
            res.status(200).json({
              success: false,
              message: "problem with mongo"
            });
          }

          if (events) {
            res.status(200).json({
              success: true,
              message: "events found",
              events: events
            });
          } else {
            res.status(200).json({
              success: false,
              message: "events couldn't be found",
            });
          }
        });
      }
    }
  );

  app.get('/api/v1/followers',
    isLoggedIn,
    function (req, res) {
      const uid = req.user.id;
      Follow.find({ fid: uid }, function (err, result) {
        if (err) {
          res.status(200).json({
            success: false,
            message: "problem with mongo",
            err: err
          });
        }

        if (result) {
          res.status(200).json({
            success: true,
            count: result.length,
            followers: result
          });
        } else {
          res.status(200).json({
            success: false,
            message: "user has no followers"
          });
        }
      });
    }
  );

  app.get('/api/v1/following',
    isLoggedIn,
    function (req, res) {
      const uid = req.user.id;
      Follow.find({ uid: uid }, function (err, result) {
        if (err) {
          res.status(200).json({
            success: false,
            message: "problem with mongo",
            err: err
          });
        }

        if (result) {
          res.status(200).json({
            success: true,
            count: result.length,
            following: result
          });
        } else {
          res.status(200).json({
            success: false,
            message: "user is not following anyone"
          });
        }
      });
    }
  );

  app.post('/api/v1/follow',
    isLoggedIn,
    function (req, res) {
      let follow = new Follow();
      follow.uid = req.user.id;
      follow.fid = req.body.fid;
      follow.fUsername = req.body.fUsername;
      follow.uUsername = req.user.username;

      Follow.findOne({ uid: follow.uid, fid: follow.fid }, 
        function (err, result) {
          if (err) {
            res.status(200).json({
              success: false,
              message: "problem with mongo",
              err: err
            });
          }

          if (result) {
            res.status(200).json({
              success: false,
              message: "already following user"
            });
          } else {
            follow.save(function (err, follow) {
              if (err) {
                res.status(200).json({
                  success: false,
                  message: "problem with mongo",
                  err: err
                });
              }

              if (follow) {
                User.findByIdAndUpdate(follow.uid, { $inc: { following: 1 } }, function (err, doc) {
                  if (err) { console.log('could not increment following for', follow.uid); }
                });

                User.findByIdAndUpdate(follow.fid, { $inc: { followers: 1 } }, function (err, doc) {
                  if (err) { console.log('could not increment followers for', follow.fid); }
                });

                let event = new Event({
                  actor: follow.uid,
                  target: follow.fid,
                  type: "USER_FOLLOW",
                  message: `${follow.uUsername} is now following ${follow.fUsername}`
                });

                event.save(function (err, savedEvent) {
                  if (err) { console.log('could not save event', event) }
                });

                res.status(200).json({
                  success: true,
                  message: "follow successful"
                });
              }
            });
          }
      });
    }
  );

  app.delete('/api/v1/follow/:fid', 
    isLoggedIn,
    function (req, res) {
      const fid = req.params.fid;
      const uid = req.user.id;

      Follow.findOne({ uid: uid, fid: fid },
        function (err, result) {
          if (err) {
            res.status(200).json({
              success: false,
              message: "problem with mongo",
              err: err
            });
          }

          if (result) {
            result.remove();

            User.findByIdAndUpdate(uid, { $inc: { following: -1 } }, function (err, doc) {
              if (err) { console.log('could not decrement following for', uid); }
            });

            User.findByIdAndUpdate(fid, { $inc: { followers: -1 } }, function (err, doc) {
              if (err) { console.log('could not increment followers for', fid); }
            });

            // TODO: Delete follow event

            res.status(200).json({
              success: true,
              message: "user unfollowed"
            });
          } else {
            res.status(200).json({
              success: false,
              message: "user was not being followed"
            });
          }
        }
      );
    }
  );

};
