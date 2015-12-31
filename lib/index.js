const magnet = require("magnet-uri");
const downloadSubtitles = require("subtitles-downloader").downloadSubtitles;
const os = require("os");
const path = require("path");
const peerflix = require("peerflix");
const debug = require("debug")("vlc-streamer");
const proc = require("child_process");
const _ = require("lodash");

module.exports = async function (uri) {
  if (!uri) {
    throw new Error("Uri is required");
  }
  const parsedUri = magnet.decode(uri);
  const name = parsedUri.name;
  if (!name) {
    throw new Error(`Invalid magnet uri ${uri}`);
  }

  const filepath = path.join(os.tmpdir(), name);
  const subtitles = await downloadSubtitles({filepath, languages: ["spa", "eng"]});
  const subtitlesPaths = _.chain(subtitles).pluck("path").compact().value();

  debug("Subtitles downloaded", subtitlesPaths);

  const engine = await startEngine(uri);
  await openVlc(engine, _.first(subtitlesPaths));

  return engine;
};

function startEngine(uri) {
  return new Promise((resolve, reject) => {
    debug(`Starting peerflix engine for ${uri}`);
    const engine = peerflix(uri);
    engine.server.on('listening', () => {
      debug(`Engine started`);
      resolve(engine);
    });
    //todo error?
  });
}

function openVlc(engine, subtitle) {
  return new Promise((resolve, reject) => {
    var localHref = `http://localhost:${engine.server.address().port}/`;

    var root = '/Applications/VLC.app/Contents/MacOS/VLC';
    var home = (process.env.HOME || '') + root;
    var VLC_ARGS = `--fullscreen --sub-file=${subtitle}`;
    const cmd = `vlc ${VLC_ARGS} ${localHref} || ${root} ${VLC_ARGS} ${localHref} || ${home} ${VLC_ARGS} ${localHref}`;

    debug(`Opening VLC: ${cmd}`);

    var vlc = proc.exec(cmd , (error, stdout, stderror) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
