"use strict";

const axios = require('axios');
const Game = require('./models/game');

const IgdbAPI = {

  baseURL: "https://igdbcom-internet-game-database-v1.p.mashape.com",
  searchRoute: "/games",

  gamesSearch: function (req, res) {
    // check db for games based on search term
    // if results of a certain number exist in db, return results
    // if results are less make request to IGDB API, return results
    IgdbAPI.remoteGameSearch(req.params.game)
      .then(function (results) {
        res.status(200).json({ games: results.data });
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  localGameSearch: function (gameTitle) {
    // text search on Game model
  },
  saveSearchResults: function (searchResultGamesResponse) {
    // save API results to db
  },
  remoteGameSearch: function (gameTitle) {
    // API request to IGDB API
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
    for (let j = 0; j < gameData.release_dates.length; j++) {
      platforms.push(gameData.release_dates[j].platform);
    }

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
      igdb_cover:               gameData.cover
    });

    return game;
  }
};

module.exports = IgdbAPI;
