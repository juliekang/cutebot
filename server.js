"use strict";

var config = require("./config"),
    util = require("./util"),
    irc = require("irc"),
    CuteMessageHandler = require("./cutemessagehandler");

console.log("Using config: " + config);

var handleMessage = function(from, to, message) {
  message = util.normalizeMessage(message);
  if (message.indexOf("cutebot") !== -1) {
    if (message === "cutebot help") {
      renderHelpMessage(bot, to);
    } else {
      handleCutenessRequest(bot, from, to);
    }
  }
}

var renderHelpMessage = function(bot, to) {
  bot.say(to, "I am cutebot. Say my name and I will give you cute.");
}

var handleCutenessRequest = function(bot, from, to) {
  var handler = new CuteMessageHandler(bot, from, to);
  handler.reply();
}

var bot = new irc.Client(config.ircHost, "cutebot", {
    channels: config.ircChannels,
    port: config.ircPort,
    debug: true,
});
bot.addListener("message", handleMessage);
