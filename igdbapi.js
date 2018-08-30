"use strict";

const axios = require('axios');
const Game = require('./models/game');
const Platform = require('./models/platform');

const Regions = [
  { "value": 1,  "name": "Europe",        "abbr": "EU"  },
  { "value": 2,  "name": "North America", "abbr": "NA"  },
  { "value": 3,  "name": "Australia",     "abbr": "AU"  },
  { "value": 4,  "name": "New Zealand",   "abbr": "NZ"  },
  { "value": 5,  "name": "Japan",         "abbr": "JP"  },
  { "value": 6,  "name": "China",         "abbr": "CH"  },
  { "value": 7,  "name": "Asia",          "abbr": "AS"  },
  { "value": 8,  "name": "Worldwide",     "abbr": null  },
  { "value": 9,  "name": "Hong Kong",     "abbr": "HK"  },
  { "value": 10, "name": "South Korea",   "abbr": "KR"  },
];

const regionToIndex = (region) => {
  return --region;
};

const IgdbAPI = {

  baseURL: "https://api-2445582011268.apicast.io",
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
    function getAllPlatforms() {
      return new Promise((resolve, reject) => {
        Platform.find({ }, function (err, platforms) {
          if (err) { reject('Mongo DB error: ' + err); }
          if (platforms) {
            resolve(platforms);
          }
        });
      });
    }

    function findGames(results) {
      return new Promise((resolve, reject) => {
        let gamesArr = [];
        const gamesData = results.data;

        gamesData.forEach((currentGame, i, arr) => {
          let game = IgdbAPI.createGame(currentGame);

          Game.findOne({ igdb_id: game.igdb_id }, (err, g) => {
            if (err) { console.log(err); }
            if (g) {
              gamesArr.push(g)
            } else {
              gamesArr.push(game);
            }
            if (arr.length == (i + 1)) {
              resolve(gamesArr);
            } 
          });
        });
      });
    }

    function fillInPlatformsAndReleaseDates(games, platforms) {
      games.forEach(game => {
        let platformsArr = game.platforms;
        let releaseDatesArr = game.igdb_release_dates;

        game.platforms = [];
        game.release_dates = [];

        platformsArr.forEach((gamePlatform, j) => {
          platforms.map(p => {
            if (platformsArr[j] == p.igdb_id) {
              game.platforms.push(p);
            }
          });
        });

        releaseDatesArr.forEach((releaseDate, j) => {
          platforms.map(p => {
            if (releaseDate.platform == p.igdb_id) {
              let date = new Date(releaseDate.date);
              let region = releaseDate.region;

              game.release_dates.push({
                "date": releaseDate.date,
                "human": date.toLocaleDateString(),
                "platform": p.igdb_name,
                "region": Regions[regionToIndex(region)],
              });
            }
          });
        });
      });

      return games;
    }

    function saveGamesWithPlatforms(games) {
      return new Promise((resolve, reject) => {
        let savedGames = [];
        games.forEach((game, i) => {
          Game.findOneAndUpdate(
            { igdb_id: game.igdb_id }, 
            game, 
            { upsert: true }, (err, doc) => {
              if (err) { reject('MongoDB error'); }
          });

          savedGames.push(game);

          if (savedGames.length == (i + 1)) {
            resolve(savedGames);
          }
        });
      });
    }

    return new Promise((resolve, reject) => {
      getAllPlatforms()
        .then((platforms) => {
          const gamesData = results.data;

          let gamesArr = [];
          gamesData.forEach(game => {
            let g = IgdbAPI.createGame(game);
            gamesArr.push(g);
          });

          const gamesWithPlatforms = fillInPlatformsAndReleaseDates(gamesArr, platforms);
          saveGamesWithPlatforms(gamesWithPlatforms)
            .then(games => {
              resolve(games);
            })
            .catch(err => {
              console.log(err);
              return;
            });
        });
    });
  },
  remoteGameSearch: function (gameTitle) {
    const gameName = gameTitle;

    let formattedGameName = gameName;
    formattedGameName = formattedGameName.toLowerCase();
    formattedGameName = formattedGameName.replace(" ", "+");

    const fields = "/?fields=name,summary,first_release_date,release_dates,developers,publishers,cover,platforms,category,time_to_beat,game_modes,genres,status,screenshots,videos,esrb,pegi,websites,dlcs,expansions,standalone_expansions,bundles,artworks,aggregated_rating";
    const expand = "&expand=platforms,publishers,developers,genres,themes,game_modes";
    const limit = "&limit=50";
    const offset = "&offset=0";
    const order = "&order=popularity:desc";
    const search = `&search=${formattedGameName}`;

    const requestURL = `${IgdbAPI.baseURL}${IgdbAPI.searchRoute}${fields}${expand}${search}`;

    return axios.get(requestURL, {
      headers: {
        'user-key': 'f7ecff83e0339f7108b16e425c9f98b8',
        'Accept': 'application/json'
      }
    })
  },
  createGame: function (gameData) {
    let platforms = new Set();

    if (gameData.release_dates) {
      for(let i = 0; i < gameData.release_dates.length; i++) {
        let release = gameData.release_dates[i]
        platforms.add(release.platform);
      }
    }

    const platformsArr = [...platforms];

    let game = new Game({
      igdb_id:                      gameData.id,
      igdb_name:                    gameData.name,
      igdb_slug:                    gameData.slug,
      igdb_first_release_date:      gameData.first_release_date,
      igdb_release_date:            gameData.release_date,
      igdb_summary:                 gameData.summary,
      igdb_release_dates:           gameData.release_dates,
      igdb_developers:              gameData.developers,
      igdb_publishers:              gameData.publishers,
      igdb_cover:                   gameData.cover,
      igdb_platforms:               gameData.platforms,
      igdb_category:                gameData.category,
      igdb_time_to_beat:            gameData.time_to_beat,
      igdb_game_modes:              gameData.game_modes,
      igdb_themes:                  gameData.themes,
      igdb_genres:                  gameData.genres,
      igdb_status:                  gameData.status,
      igdb_alternative_name:        gameData.alternative_name,
      igdb_screenshots:             gameData.screenshots,
      igdb_videos:                  gameData.videos,
      igdb_esrb:                    gameData.esrb,
      igdb_pegi:                    gameData.pegi,
      igdb_websites:                gameData.websites,
      igdb_dlcs:                    gameData.dlcs,
      igdb_expansions:              gameData.expansions,
      igdb_standalone_expansions:   gameData.standalone_expansions,
      igdb_bundles:                 gameData.bundles,
      igdb_games:                   gameData.games,
      igdb_artworks:                gameData.artworks,
      igdb_aggregated_rating:       gameData.aggregated_rating,
      platforms:                    platformsArr,
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
        'user-key': 'f7ecff83e0339f7108b16e425c9f98b8',
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
