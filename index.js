var static = require('node-static');  
 
var FeedParser = require('feedparser');  
var request = require('request');
var kue = require('kue');
var jobs = kue.createQueue();


function play(podcast, done) {
  console.log("Playing", podcast.title);
  setTimeout(console.log("done"), 50000);

  done();
}



request('http://radiofrance-podcast.net/podcast09/rss_10078.xml')
  .pipe(new FeedParser())
  .on('readable', function() {
    var stream = this, item;
    while (item = stream.read()) {
      // send the feed as job in the queue
      var job = jobs.create('podcast', {
          title: item.title,
          file: item.guid,
          description: item.description
      });

      job.on('complete', function(result){
        console.log("Job completed with data ", result);
      })

      job.save( function(err){
         if( !err ) console.log( job.id );
      });


      jobs.on('job complete', function(id,result){
        kue.Job.get(id, function(err, job){
          if (err) return;
          job.remove(function(err){
            if (err) throw err;
            console.log('removed completed job #%d', job.id);
          });
        });
      });


    }
  });

jobs.process('podcast', function(job, done){
  play(job.data, done);
});

kue.app.listen(3333);
