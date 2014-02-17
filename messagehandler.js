"use strict";

var config = require("./config"),
    util = require("./util"),
    imageSearchClient = require("google-images"),
    request = require("request"),
    redis = require("redis"),
    redisClient = redis.createClient();

var CuteMessageHandler = function(bot, from, to) {
  this.bot = bot;
  this.from = from;
  this.to = to;
};

CuteMessageHandler.prototype.reply = function() {
  this.animal = this.getRandomAnimal();
  this.page = this.getRandomPage();
  this.hitNum = this.getRandomResultIndex();
  this.cacheKey = this.getCacheKey();
  this.checkCacheAndReply();
};

CuteMessageHandler.prototype.checkCacheAndReply = function() {
  redisClient.get(this.cacheKey, this.checkCache.bind(this));
};

CuteMessageHandler.prototype.checkCache = function(err, reply) {
  this.cachedValue = reply;
  if (this.cachedValue) {
    console.log("Found " + this.cachedValue + " for key:" + this.cacheKey);
    this.bot.say(this.to, "Hey " + this.from + "! Take this " + this.animal + "! " + this.cachedValue);
  } else {
    console.log("CACHE MISS for key:" + this.cacheKey);
    var query = "cute " + this.animal;
    imageSearchClient.search(query, {
      page: this.page, 
      callback: this.handleImageSearchResponse.bind(this)
    });
  }
};

CuteMessageHandler.prototype.handleImageSearchResponse = function(status, images) {
  var payload = { longUrl: images[this.hitNum].url };
  request.post({
    url: "https://www.googleapis.com/urlshortener/v1/url?key=" + config.googleAPIKey, 
    json: payload
  }, this.handleUrlShortenerResponse.bind(this));
};

CuteMessageHandler.prototype.handleUrlShortenerResponse = function(error, response, body) {
  var url = body.id;
  redisClient.set(this.cacheKey, url);
  redisClient.expire(this.cacheKey, config.cacheExpiry);
  console.log("Caching " + url + " for key: " + this.cacheKey);
  this.bot.say(this.to, "Hey " + this.from + "! Take this " + this.animal + "! " + url);
};

CuteMessageHandler.prototype.getRandomAnimal = function() {
  return config.animals[util.getRandomInt(0, config.animals.length - 1)];
};

CuteMessageHandler.prototype.getRandomPage = function() {
  return util.getRandomInt(1, config.numResultPages);
};

CuteMessageHandler.prototype.getRandomResultIndex = function() {
  // There are 3 results per page from the (deprecated) Google Image Search API.
  return util.getRandomInt(0, 2);
};

CuteMessageHandler.prototype.getCacheKey = function() {
  if (!this.animal || !this.page || !this.hitNum) {
    console.log("WARNING: cache key generated without initialized values.");
  }
  return this.animal + "-" + this.page + "-" + this.hitNum;
};

module.exports = CuteMessageHandler;