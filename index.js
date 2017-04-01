const scrapeIt = require('scrape-it');

let gameName = process.argv[2];
gameName = gameName.toLowerCase();
gameName = gameName.replace(" ", "+");

const mobyGamesSearchUrl = "http://www.mobygames.com/search/quick?q=";

const gameSearchUrl = `${mobyGamesSearchUrl}${gameName}`;

console.log(gameSearchUrl);

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
        attr: 'src'
      }
    }
  }
}).then(data => {
  console.log(data);
});
