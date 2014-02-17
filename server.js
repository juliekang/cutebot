var irc = require('irc');
var images_search_client = require('google-images');
var request = require('request');
var fs, configurationFile;
 
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
      animal = animals[getRandomInt(0, animals.length - 1)];
      images_search_client.search(
        'cute ' + animal, {
          page: getRandomInt(1, 10), 
          callback: function(status, images) {
            url = images[0].url;
            //console.log(url);

          var payload = { longUrl: url };
          request.post({
            url: 'https://www.googleapis.com/urlshortener/v1/url?key=' + GAPI_KEY, 
            json:payload
          }, function(error, response, body) {
            bot.say(to, "Here " + from + "!  Take this " + animal + "! " + body.id);
            console.log(JSON.stringify(body));
          });
        }
      });
    }
  }
});
