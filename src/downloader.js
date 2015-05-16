"use strict";

var http = require('http');
var fs = require('fs');

var downloader = function(url, dest, callback) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(callback);
    });
  });
}


module.exports = downloader;