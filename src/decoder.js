"use strict";

var lame = require('lame');
var wav = require('wav');

var decode = function(output){

  var decoder = new lame.Decoder({
		outSampleRate: 44100
	});

  function onFormat (format) {
    console.log('MP3 format: %j', format);

    var writer = new wav.Writer(format);
    decoder.pipe(writer).pipe(output);
  }
  
  decoder.on('format', onFormat);
  return decoder;
}


module.exports = decode;

