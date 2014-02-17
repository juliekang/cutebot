"use strict";

var irc = require('irc');
var images_search_client = require('google-images');
var request = require('request');
var redis = require("redis"),
    redisClient = redis.createClient();
var fs = require('fs'), 
    configurationFile = 'configuration.json',
    configuration = JSON.parse(
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
      var animals = configuration.supportedAnimals;
      var index = getRandomInt(0, animals.length - 1);
      var page = getRandomInt(1, configuration.numResultPages);
      // There are 3 results per page from the (deprecated) Google Image Search API.
      var hitNum = getRandomInt(0, 2);
      var animal = animals[index];

      var cacheKey = animal + "-" + page + "-" + hitNum;
      var cachedValue;

      redisClient.get(cacheKey, function(err, reply) {
        cachedValue = reply;
        if (cachedValue) {
          console.log("Found value \"" + cachedValue + "\" for key \"" + cacheKey + "\"");
          bot.say(to, "Hey " + from + "! Take this " + animal + "! " + cachedValue);
        } else {
          console.log("CACHE MISS!!! for key \"" + cacheKey + "\"");
          images_search_client.search(
            'cute ' + animal, {
              page: page, 
              callback: function(status, images) {
                var payload = { longUrl: images[hitNum].url };
                request.post({
                  url: 'https://www.googleapis.com/urlshortener/v1/url?key=' + GAPI_KEY, 
                  json:payload
                }, function(error, response, body) {
                  var url = body.id;
                  redisClient.set(cacheKey, url);
                  bot.say(to, "Hey " + from + "! Take this " + animal + "! " + url);
                });
              }
            }
          );
        }
      });
    }
  }
});
