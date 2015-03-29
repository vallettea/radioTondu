"use strict";
 
var FeedParser = require('feedparser');  
var request = require('request');
var Datastore = require('nedb');
var db = new Datastore({ filename: 'db.json', autoload: true });

var podcasts = require("./podcasts.json");
var downloader = require("./downloader.js");
var decoder = require("./decoder.js");


function play(podcast, done) {
  console.log("Playing", podcast.title);
  setTimeout(console.log("done"), 50000);
  // input.pipe(decoder);

  done();
}


// update the database
podcasts.forEach(function(podcast){
  console.log("Updating: " + podcast.title);

  request(podcast.url)
    .pipe(new FeedParser())
    .on('readable', function() {
      var stream = this, item;
      while (item = stream.read()) {
        var podcast = item;
        // check if the entry exists in db
        db.count({ file: item.guid }, function (err, count) {
          if(count === 0){
            // persists in db
            db.insert({
                title: podcast.title,
                file: podcast.guid,
                description: podcast.description,
                broadcasted: false
            });
            console.log("Inserting doc: " + podcast.title);
          };
        });
      }
    });

})

// take a random podcast among unread
db.count({broadcasted: false}, function(err, nbUnBroacasted){

  if (nbUnBroacasted > 0){
    var rand = Math.floor(Math.random() * nbUnBroacasted );
    db.find({broadcasted: false}).skip(rand).limit(1).exec(function (err, docs) {
      var currentPodcast = docs[0];
      console.log("Now playing " + currentPodcast.title)
      downloader(currentPodcast.file, "temp.mp3", function(){console.log("finished")})
      // play podcast


      // set podcast as broadcasted
      db.update({ file:  currentPodcast.file}, { $set: { broadcasted: true } }, { multi: true }, function (err, numReplaced) {
        console.log("nb updated " + numReplaced)
      });
    });
  };

})



