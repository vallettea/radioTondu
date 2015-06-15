"use strict";

var lame = require('lame');
var wav = require('wav');

var decode = function(output){

  var decoder = new lame.Decoder({
		outSampleRate: 44100
	});
  var writer;
  var dd;

  function onFormat (format) {
    console.log('MP3 format: %j', format);

    writer = new wav.Writer(format);
    dd = decoder.pipe(writer)
    dd.pipe(output);
  }
  
  decoder.on('format', onFormat);
  decoder.stop = function(){
    dd.unpipe(output);
    decoder.unpipe(writer);
  };
  return decoder;
}


module.exports = decode;

