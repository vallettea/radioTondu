"use strict";

var lame = require('lame');
var wav = require('wav');


function onFormat (format) {
  console.error('MP3 format: %j', format);

  var writer = new wav.Writer(format);
  decoder.pipe(writer);
}

var decoder = new lame.Decoder();
decoder.on('format', onFormat);


module.exports = decoder;
