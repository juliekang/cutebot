exports.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

exports.normalizeMessage = function(message) {
  return message.trim().toLowerCase();
};
