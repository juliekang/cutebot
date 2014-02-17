var irc = require('irc');
var images_search_client = require('google-images');
var request = require('request');
var fs, configurationFile;
 
var CACHE = {};

configurationFile = 'configuration.json';
fs = require('fs');
 
var configuration = JSON.parse(
    fs.readFileSync(configurationFile)
);

// You will need to supply your own Google API Key
var GAPI_KEY = configuration.googleAPIKey;

// You will need to supply your own IRC server and desired channel(s)
var bot = new irc.Client(configuration.ircHost, 'cutebot', {
    channels: configuration.ircChannels,
    port: configuration.ircPort,
    debug: true,
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

bot.addListener('message', function(from, to, message) {
  message = message.trim().toLowerCase();

  if (message.indexOf('cutebot') !== -1) {
    if (message === 'cutebot help') {
      bot.say(to, 'I am cutebot. Say my name and I will give you cute.');
    } else {
      var animals = ['dog', 'cat', 'puppy', 'kitten', 'otter', 'owl', 'pig', 'piglet', 'benedict cumberbatch', 'seal', 'duckling', 'chick', 'corgi'];
      index = getRandomInt(0, animals.length - 1);
      page = getRandomInt(1, 10);
      animal = animals[index];
      if (!CACHE[animal + page]) {
        images_search_client.search(
          'cute ' + animal, {
            page: page, 
            callback: function(status, images) {
              var payload = { longUrl: images[0].url };
              request.post({
                url: 'https://www.googleapis.com/urlshortener/v1/url?key=' + GAPI_KEY, 
                json:payload
              }, function(error, response, body) {
                CACHE[animal + page] = body.id;
                bot.say(to, "Hey " + from + "! Take this " + animal + "! " + body.id);
              });
            }
          }
        );
      } else {
        bot.say(to, "Hey " + from + "! Take this " + animal + "! " + CACHE[animal + page]);
      }
    }
  }
});
