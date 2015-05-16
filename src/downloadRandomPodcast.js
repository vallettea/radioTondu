"use strict";

var downloader = require("./downloader.js");

module.exports = function(db){

   // take a random podcast among unread and download it to data
   db.count({broadcasted: false}, function(err, nbUnBroacasted){

      if (nbUnBroacasted > 0){
         var rand = Math.floor(Math.random() * nbUnBroacasted );
         db.find({broadcasted: false, downloaded: false}).skip(rand).limit(1).exec(function (err, docs) {
            var currentPodcast = docs[0];
            console.log("Downloading " + currentPodcast.title);
            var parts = currentPodcast.file.split("/");
            var filename = "data/" + parts[parts.length - 1];
            downloader(currentPodcast.file, filename, function(){
               console.log("Finished downloading " + currentPodcast.title);
               db.update({_id: currentPodcast._id}, { $set: { downloaded: true, path: filename} }, {}, function (err, numReplaced) {
                  if (err) { console.log(err)};
               })
            });
         });
      };

   });
}