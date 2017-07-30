"use strict";

const axios = require('axios');
const Game = require('./models/game');
const Platform = require('./models/platform');

const IgdbAPI = {

  baseURL: "https://igdbcom-internet-game-database-v1.p.mashape.com",
  searchRoute: "/games",
  platformsRoute: "/platforms",

  gamesSearch: function (req, res) {
    /*
    IgdbAPI.localGameSearch(req.params.game)
      .then((games) => {
        // if games.length > 0 && games.length < limit
        // - perform remote search with offset of (limit - games.length)
        // - save new results to db
        // - return local results that equal limit
        // if games.length >= limit
        // - return only local results
        // if games.length == 0
        // - perform remote search and save
        if (games.length > 0) {
          res.status(200).json({ games: games });
        } else {
          IgdbAPI.remoteGameSearch(req.params.game)
            .then(IgdbAPI.saveSearchResults)
            .then(games => res.status(200).json({ games: games }))
            .catch(function (error) {
              console.log(error);
            });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
     */
    IgdbAPI.remoteGameSearch(req.params.game)
      .then(IgdbAPI.saveSearchResults)
      .then(games => res.status(200).json({ games: games }))
      .catch(function (error) {
        console.log(error);
      });
  },
  localGameSearch: function (gameTitle) {
    let query = Game.find(
      { $text: { $search: gameTitle } }, 
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    var gamesFindPromise = query.exec();
    return gamesFindPromise;
  },
  saveSearchResults: function (results) {
    const gamesData = results.data;
    let gamesArr = [];
    for (let i = 0; i < gamesData.length; i++) {
      let currentGame = gamesData[i];
      let game = IgdbAPI.createGame(currentGame);

      Game.findOne({ igdb_id: game.igdb_id }, function (err, g) {
        if (err) { console.log(err); }
        if (g) {
          return;
        } else {
          game.save();
        }
      });

      gamesArr.push(game);
    }

    return new Promise((resolve, reject) => {
      if (gamesArr.length > 0) {
        resolve(gamesArr);
      } else {
        reject('error');
      }
    });

    /*
    return new Promise((resolve, reject) => {
      // errors on duplicate insert
      Game.insertMany(gamesArr, { ordered: false })
      .then(function (docs) {
        resolve(docs);
      })
      .catch(function(err) {
        reject(err);
      });
    });
    */
  },
  remoteGameSearch: function (gameTitle) {
    const gameName = gameTitle;

    let formattedGameName = gameName;
    formattedGameName = formattedGameName.toLowerCase();
    formattedGameName = formattedGameName.replace(" ", "+");

    const fields = "/?fields=name,summary,first_release_date,release_dates,developers,publishers,cover";
    const limit = "&limit=50";
    const offset = "&offset=0";
    const order = "&order=popularity:desc";
    const search = `&search=${formattedGameName}`;

    const requestURL = `${IgdbAPI.baseURL}${IgdbAPI.searchRoute}${fields}${limit}${offset}${search}`;

    return axios.get(requestURL, {
      headers: {
        'X-Mashape-Key': 'Mbdgn3uSLGmshtPQy8REhgo185VCp1ACZ71jsn7kHzoUrEj3Ln',
        'Accept': 'application/json'
      }
    })
  },
  createGame: function (gameData) {
    let platforms = new Set();
    if (gameData.release_dates) {
      for(let i = 0; i < gameData.release_dates.length; i++) {
        platforms.add(gameData.release_dates[i].platform);
      }
    }
    const platformsArr = [...platforms];

    let game = new Game({
      igdb_id:                  gameData.id,
      igdb_name:                gameData.name,
      igdb_slug:                gameData.slug,
      igdb_first_release_date:  gameData.first_release_date,
      igdb_release_date:        gameData.release_date,
      igdb_summary:             gameData.summary,
      igdb_release_dates:       gameData.release_dates,
      igdb_developers:          gameData.developers,
      igdb_publishers:          gameData.publishers,
      igdb_cover:               gameData.cover,
      platforms:                platformsArr
    });

    return game;
  },
  remotePlatformFetch: function (offset) {
    const fields = "/?fields=name,alternative_name";
    const limit = "&limit=50";
    const offsetParam = `&offset=${offset}`;

    const requestURL = `${IgdbAPI.baseURL}${IgdbAPI.platformsRoute}${fields}${limit}${offsetParam}`;

    return axios.get(requestURL, {
      headers: {
        'X-Mashape-Key': 'Mbdgn3uSLGmshtPQy8REhgo185VCp1ACZ71jsn7kHzoUrEj3Ln',
        'Accept': 'application/json'
      }
    });
  },
  savePlatforms: function (results) {
    const platformsData = results.data;
    let platformsArr = [];
    for (let i = 0; i < platformsData.length; i++) {
      let currentPlatform = platformsData[i];
      let platform = IgdbAPI.createPlatform(currentPlatform);
      platformsArr.push(platform);
    }

    return new Promise((resolve, reject) => {
      Platform.insertMany(platformsArr, function(err, docs) {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  },
  createPlatform: function (platformData) {
    let platform = new Platform({
      igdb_id:                platformData.id,
      igdb_name:              platformData.name,
      igdb_alternative_name:  platformData.alternative_name
    });

    return platform;
  },
  getRemotePlatforms: function (req, res) {
    IgdbAPI.remotePlatformFetch(req.params.offset)
    .then(IgdbAPI.savePlatforms)
    .then(platforms => res.json({ success: "true", documentsAdded: platforms.length }))
    .catch(error => console.log(error));
  },
  usersSearch: function (req, res) {
  }
};

module.exports = IgdbAPI;
