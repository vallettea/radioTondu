"use strict";
 
var radio = require('nodefm-rpi');

var decoder = require("./src/decoder.js");
var updatePodcastList = require("./src/updatePodcastList.js");
var downloadRandomPodcast =  require("./src/downloadRandomPodcast.js");
var schedule = require('node-schedule');
var du = require('du');
var fs = require("fs");

var Datastore = require('nedb');
var db = new Datastore({ filename: 'data/db.json', autoload: true });

var path = require('path');
var express = require('express');
var http = require('http');
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);
io.set('origins', '*:*');

// maximum size of the data folder containing downloaded podcasts
var MAX_SPACE = 1000000000; //1Gb
var FREQUENCY = "88.7";

// turn on the emitter
var emitter = new radio(FREQUENCY);
var radioStream = emitter.start();

// initilize podcast list
db.count({}, function (err, count) {
   if (count === 0){
      updatePodcastList(db).then(function(){
         console.log("Finished initializing podcasts list.");
      })
   }
});


// // every minute check if there is some space left and if yes, download a podcast   
// schedule.scheduleJob('*/1 * * * *', function(){
//    console.log("Checking space on device");

//    du('./data', function (err, size) {
//       if (size < MAX_SPACE){
//          downloadRandomPodcast(db);
//       }
//    });
// });

// check for availbale unread podcast and play it
var readnext = function(){
   db.find({broadcasted: false, downloaded: true}).exec(function (err, docs) {
      if (docs.length > 0){
         var currentPodcast = docs[0];
         console.log("opening ", currentPodcast.path)
         var stream = fs.createReadStream(currentPodcast.path);
         stream
            .pipe(decoder(radioStream))
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
         return stream;
      } else {
         console.log("No podcast downloaded yet, please wait");
         setTimeout(function(){ readnext() }, 10000);
      }
   })
}
var stream = readnext();

// update the podcast database every day at 2 am
schedule.scheduleJob('00 02 * * *', function(){
   updatePodcastList(db).then(function(){
      console.log("Updated podcasts database.");
   });
});

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
      if(broadcasting === false){
         stream.pause();
         emitter.stop();
      } else {
         radioStream = emitter.start();
         stream = readnext();
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

