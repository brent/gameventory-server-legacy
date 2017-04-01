"use strict";

const express = require('express');
const app = express();
const scrapeIt = require('scrape-it');
const morgan = require('morgan');

// disallows Express detection
app.disable('x-powered-by');

// enables request logging
app.use(morgan('dev'));

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

app.get('/api/v1/search/:game', function(req, res) {
  let gameName = req.params.game;
  gameName = gameName.toLowerCase();
  gameName = gameName.replace(" ", "+");

  const mobyGamesBaseUrl = "http://www.mobygames.com";
  const mobyGamesSearchUrl = `${mobyGamesBaseUrl}/search/quick?q=`;
  const gameSearchUrl = `${mobyGamesSearchUrl}${gameName}`;

  scrapeIt(gameSearchUrl, {
    games: {
      listItem: '#searchResults .searchSubSection .searchResult',
      data: {
        gameTitle: '.searchTitle a',
        gamePlatforms: {
          listItem: '.searchDetails span'
        },
        gameImg: {
          selector: '.searchResultImage',
          attr: 'src',
          convert: x => `${mobyGamesBaseUrl}${x}`
        }
      }
    }
  }).then(data => {
    res.status(200).json(data);
  });
});

const server = app.listen(3000, function() {
  const port = server.address().port;
  console.log('listening @ localhost:' + port);
});
