#!/usr/bin/env node

var vlcStreamer = require("./index");

var magnet = process.argv[2];
vlcStreamer(magnet).catch((e) => {
  console.error("Error", e);
});

