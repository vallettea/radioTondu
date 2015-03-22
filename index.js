var static = require('node-static');  
var Primus = require('primus');  
var http = require('http');  
var FeedParser = require('feedparser');  
var request = require('request');

var file = new static.Server('./public');

var server = http.createServer(function (request, response) {  
  request.addListener('end', function () {
    file.serve(request, response);
  }).resume();
}).listen(process.env.PORT || 8082);

var primus = new Primus(server, { parser: 'JSON' });  
var onError = function (error) { console.error(error); };

primus.on('connection', function connection(spark) {  
  request('http://radiofrance-podcast.net/podcast09/rss_10078.xml')
    .on('error', onError)
    .pipe(new FeedParser())
    .on('error', onError)
    .on('readable', function() {
      var stream = this, item;
      while (item = stream.read()) {
        spark.write(item);
      }
    });
});

primus.save(__dirname + '/public/js/primus.js');

console.log(process.env.PORT || 8082);  