"use strict";

const axios = require('axios');
const Game = require('./models/game');

const IgdbAPI = {

  baseURL: "https://igdbcom-internet-game-database-v1.p.mashape.com",
  searchRoute: "/games",

  gamesSearch: function (req, res) {
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
      gamesArr.push(game);
    }

    return new Promise((resolve, reject) => {
      Game.insertMany(gamesArr, function(err, docs) {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    })
  },
  remoteGameSearch: function (gameTitle) {
    const gameName = gameTitle;

    let formattedGameName = gameName;
    formattedGameName = formattedGameName.toLowerCase();
    formattedGameName = formattedGameName.replace(" ", "+");

    const fields = "/?fields=name,summary,first_release_date,release_dates,developers,publishers,cover";
    const limit = "&limit=20";
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
    let platforms = [];

    let game = new Game({
      igdb_id:                  gameData.id,
      igdb_name:                gameData.name,
      igdb_slug:                gameData.slug,
      igdb_first_release_date:  gameData.first_release_date,
      igdb_release_date:        gameData.release_date,
      igdb_summary:             gameData.summary,
      igdb_release_dates:       gameData.release_dates,
      igdb_platforms:           platforms,
      igdb_developers:          gameData.developers,
      igdb_publishers:          gameData.publishers,
      igdb_cover:               gameData.cover,
      igdb_popularity:          gameData.popularity
    });

    return game;
  }
};

module.exports = IgdbAPI;
