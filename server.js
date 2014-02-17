"use strict";

var util = require("./util"),
    irc = require("irc"),
    imageSearchClient = require("google-images"),
    request = require("request"),
    redis = require("redis"),
    redisClient = redis.createClient(),
    fs = require("fs");

var configFile = "config.json",
    config = JSON.parse(
      fs.readFileSync(configFile)
    );

var bot = new irc.Client(config.ircHost, "cutebot", {
    channels: config.ircChannels,
    port: config.ircPort,
    debug: true,
});

bot.addListener("message", function(from, to, message) {
  var animal, page, hitNum, cacheKey, cachedValue;

  message = util.normalizeMessage(message);
  if (message.indexOf("cutebot") !== -1) {
    if (message === "cutebot help") {
      bot.say(to, "I am cutebot. Say my name and I will give you cute.");
    } else {
      animal = getRandomAnimal();
      page = getRandomPage();
      hitNum = getRandomResultIndex();
      cacheKey = getCacheKey(animal, page, hitNum);

      redisClient.get(cacheKey, function(err, reply) {
        cachedValue = reply;
        if (cachedValue) {
          console.log("Found " + cachedValue + " for key:" + cacheKey);
          bot.say(to, "Hey " + from + "! Take this " + animal + "! " + cachedValue);
        } else {
          console.log("CACHE MISS for key:" + cacheKey);
          imageSearchClient.search(
            "cute " + animal, {
              page: page, 
              callback: function(status, images) {
                var payload = { longUrl: images[hitNum].url };
                request.post({
                  url: "https://www.googleapis.com/urlshortener/v1/url?key=" + config.googleAPIKey, 
                  json:payload
                }, function(error, response, body) {
                  var url = body.id;
                  redisClient.set(cacheKey, url);
                  redisClient.expire(cacheKey, config.cacheExpiry);
                  console.log("Caching " + url + " for key: " + cacheKey);
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

function getRandomAnimal() {
  return config.animals[util.getRandomInt(0, config.animals.length - 1)];
};

function getRandomPage() {
  return util.getRandomInt(1, config.numResultPages);
}

function getRandomResultIndex() {
  // There are 3 results per page from the (deprecated) Google Image Search API.
  return util.getRandomInt(0, 2);
}

function getCacheKey(animal, page, hitNum) {
  return animal + "-" + page + "-" + hitNum;
};
