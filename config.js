"use strict";

var fs = require("fs"),
    config = JSON.parse(fs.readFileSync("config.json"));

module.exports = config;
