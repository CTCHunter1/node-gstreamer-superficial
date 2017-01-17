#!/usr/bin/env node

// this will crate a stream playable in vlc. It can only be opned once. Won't load
// in firefox. 

const gstreamer = require('../..');
var fs = require('fs');

const pipeline = new gstreamer.Pipeline('videotestsrc horizontal-speed=1 is-live=true ' +
'! video/x-raw,format=(string)RGB,framerate=15/1 ! videoconvert ' +
'! x264enc ! mp4mux name=mux1 fragment-duration=1000 ! appsink max-buffers=1 name=sink');
// mp4Mux spits out a mimetype of video/quicktime. 
// this only works with the4 fragment-duration flag and only in vlc. 

const clients = [];
let headers;
var mimeType = 'video/mp4'; 
var bUseCapMimeType = 0; // if=1 mimetype will be replaced by the mimetype in
// caps if=0 mimeType above will not be changed.
const boundary='boundarydonotcross'; // designator for html boundry

const appsink = pipeline.findChild('sink');
//const gsmux = pipeline.findChild('mux1');
//var bOnce = 1;

var pull = function() {
    appsink.pull(function(buf, caps) {
    	if (caps) {
    		//console.log("CAPS", caps);
    		if (bUseCapMimeType==1) {
    		   mimeType = caps['name'];
    		}
    		// why is this missing?
    		header=caps['streamheader'];
    		   
    	}
      if (buf) {
            console.log("BUFFER size",buf.length);
            //var gsmux = pipeline.findChild('mux1');
			for( c in clients ) {
				clients[c].write(buf);
			}
			pull();
        } else {
            setTimeout(pull, 500);
        }
    });
};

// ideally play is here
// because we're not sure if there is header information in the first 
// mp4mux packets making it playable we avaoid missing packets and start gstreamer on 
// connect
//pipeline.play();

pull();

pipeline.pollBus( function(msg) {
//	console.log('bus message:',msg);
	switch( msg.type ) {
		case 'eos': 
			pipeline.stop();
			break;
	}
});


const config = { http_port:8001 };

const express = require('express');
const app = express();

// write the multipart mjpeg header
app.get('/stream', function(req, res){
   
   res.writeHead(200, {
    'Connection':'close',
    'Cache-Control':'private',
    'Content-Type':'video/mp4',
    'Server':'CustomStreamer/0.0.1',
  });
  
  clients.push(res);
  
  pipeline.play();
  res.on('close', function() {
  	console.log('client closed'); 
    var index = clients.indexOf(res);
    clients.splice(index, 1);
    });
});

app.use(express.static(__dirname));

console.log('Running http server on port', config.http_port);
app.listen(config.http_port);
