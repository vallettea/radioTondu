"use strict";


var podcasts = require("../podcasts.json");
var FeedParser = require('feedparser'); 
var request = require('request');


module.exports = function(db) {

   var nbChecked = 0;

   return new Promise(function(resolve, reject){
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
                           downloaded: false,
                           path: null,
                           broadcasted: false
                        });
                        console.log("Inserting doc: " + podcast.title);
                     };
                  });
               }
            })
            .on("end", function(){
               console.log("Finished updating ", podcast.title);
               nbChecked++;
               if (nbChecked >= podcasts.length){
                  resolve();
               }
            })
            .on("error", function(err){
               console.log("error :", err);
               reject(err);
            })
      });
   });
}