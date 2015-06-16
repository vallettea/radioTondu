"use strict";

var fs = require("fs");
var path = require('path');
var express = require('express');
var http = require('http');
var Datastore = require('nedb');
var updatePodcastList = require("./src/updatePodcastList.js");

var radio = require('nodefm-rpi');
var decoder = require("./src/decoder.js");
var scheduler = require("./src/scheduler.js");


// maximum size of the data folder containing downloaded podcasts
var MAX_SPACE = 1000000000; //1Gb
var FREQUENCY = "88.3";

// turn on the emitter
var emitter = new radio(FREQUENCY);
var radioStream = emitter.start();
var fmStream = decoder(radioStream);

// initilize podcast list
var db = new Datastore({ filename: 'data/db.json', autoload: true });
db.count({}, function (err, count) {
   if (count === 0){
      updatePodcastList(db).then(function(){
         console.log("Finished initializing podcasts list.");
      })
   }
});
scheduler(db, MAX_SPACE);

var castStream;

// check for availbale unread podcast and play it
var readnext = function(){
   db.find({broadcasted: false, downloaded: true}).exec(function (err, docs) {
      if (docs.length > 0){
         var currentPodcast = docs[0];
         console.log("opening ", currentPodcast.path)
         castStream = fs.createReadStream(currentPodcast.path);
         castStream
            .pipe(fmStream)
            .on ("end", function(){
               // set podcast as broadcasted
               db.update({ file:  currentPodcast.file}, { $set: { broadcasted: true, downloaded: false, path: null } }, { multi: true }, function (err, numReplaced) {
                 console.log("nb updated " + numReplaced)
               });
               // remove file
               fs.unlink(currentPodcast.path, function (err) {
                  if (err) console.log(err);
                  console.log('successfully deleted ', currentPodcast.path);
               });
               readnext();
            });
      } else {
         console.log("No podcast downloaded yet, please wait");
         setTimeout(function(){ readnext() }, 10000);
      }
   })
}
readnext();


// API

var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);
io.set('origins', '*:*');

app.use("/font-awesome/css/font-awesome.min.css", express.static(path.join(__dirname, 'client/font-awesome/css/font-awesome.min.css')));
app.use("/css", express.static(path.join(__dirname, 'client/css')));

app.get('/bundle-vendor.js', function(req, res){
    res.sendFile(path.join(__dirname, 'client/js/bundle-vendor.js'));
});
app.get('/bundle-app.js', function(req, res){
    res.sendFile(path.join(__dirname, 'client/js/bundle-app.js'));
});


io.on('connection', function(socket) {
   
   //send current state
   socket.emit('currentState', {
      "broadcasting": true,

   });

   socket.on('broadcasting', function (broadcasting) {
      console.log('received broadcasting')
      if(broadcasting === false){
         
         fmStream.stop();
         setTimeout(function(){ // dirty but one has to be sure nothing is piping in piFM rds or there is an error
            castStream.unpipe(fmStream);
            emitter.stop();
         }, 1000)
         
      } else {
         radioStream = emitter.start();
         fmStream = decoder(radioStream);
         readnext();
      }
   });

})


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

server.listen(4000, function () {

   var host = server.address().address;
   var port = server.address().port;

   console.log('RadioTondu listening at http://%s:%s', host, port);

})

