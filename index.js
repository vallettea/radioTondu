"use strict";
 
var radio = require('nodefm-rpi');

var decoder = require("./src/decoder.js");
var updatePodcastList = require("./src/updatePodcastList.js");
var downloadRandomPodcast =  require("./src/downloadRandomPodcast.js");
var schedule = require('node-schedule');
var du = require('du');

var Datastore = require('nedb');
var db = new Datastore({ filename: 'data/db.json', autoload: true });

// maximum size of the data folder containing downloaded podcasts
var MAX_SPACE = 1000000000; //1Gb
var FREQUENCY = "88.7";

// turn on the emitter
var emitter = new radio(FREQUENCY);
var i = emitter.start();

// initilize podcast list
updatePodcastList(db).then(function(){
   console.log("Finished initializing podcasts list.");
})

// every minute check if there is some space left and if yes, download a podcast   
schedule.scheduleJob('*/1 * * * *', function(){
   console.log("Checking space on device");

   du('./data', function (err, size) {
      if (size < MAX_SPACE){
         downloadRandomPodcast(db);
      }
   });
});

// check for availbale unread podcast and play it

var readnext = function(){
   db.find({broadcasted: false, downloaded: true}).exec(function (err, docs) {
      var currentPodcast = docs[0];

      fs.createReadStream(currentPodcast.path)
         .pipe(decoder(emitter))
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
   })
}

readnext();

// update the podcast database every day at 2 am
schedule.scheduleJob('00 02 * * *', function(){
   updatePodcastList(db).then(function(){
      console.log("Updated podcasts database.");
   });
});

