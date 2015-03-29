"use strict";

var lame = require('lame');
var wav = require('wav');


var  input = process.stdin;
var  output = process.stdout;

function onFormat (format) {
  console.error('MP3 format: %j', format);

  var writer = new wav.Writer(format);
  decoder.pipe(writer).pipe(output);
}

var decoder = new lame.Decoder();
decoder.on('format', onFormat);


module.exports = decoder;
