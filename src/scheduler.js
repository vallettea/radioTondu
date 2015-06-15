"use strict";

var schedule = require('node-schedule');
var updatePodcastList = require("./updatePodcastList.js");
var downloadRandomPodcast =  require("./downloadRandomPodcast.js");


module.exports = function(db) {

	// every minute check if there is some space left and if yes, download a podcast   
	schedule.scheduleJob('*/1 * * * *', function(){
	   console.log("Checking space on device");

	   du('./data', function (err, size) {
	      if (size < MAX_SPACE){
	         downloadRandomPodcast(db);
	      }
	   });
	});


	// update the podcast database every day at 2 am
	schedule.scheduleJob('00 02 * * *', function(){
	   updatePodcastList(db).then(function(){
	      console.log("Updated podcasts database.");
	   });
	});
};