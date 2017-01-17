#!/usr/bin/env node

// attempt to do by doing mp4 with mpeg-streamer also doesn't work. 

const gstreamer = require('../..');
var fs = require('fs');

const pipeline = new gstreamer.Pipeline('videotestsrc horizontal-speed=1 is-live=true ' +
'! video/x-raw,format=(string)RGB,framerate=4/1 ! videoconvert ' +
'!x264enc ! mp4mux streamable=true fragment-duration=1000 ! appsink max-buffers=1 name=sink');
// mp4Mux spits out a mimetype of video/quicktime. 

const clients = [];
let headers;
var mimeType = 'video/mp4'; 
var bUseCapMimeType = 0; // if=1 mimetype will be replaced by the mimetype in
// caps if=0 mimeType above will not be changed.
const boundary='boundarydonotcross'; // designator for html boundry

const appsink = pipeline.findChild('sink');
//var bOnce = 1;

var pull = function() {
    appsink.pull(function(buf, caps) {
    	if (caps) {
    		//console.log("CAPS", caps);
    		if (bUseCapMimeType==1) {
    		   mimeType = caps['name'];
    		}
    		header=caps['streamheader']
    		   
    	}
      if (buf) {
            console.log("BUFFER size",buf.length);
			for( c in clients ) {
			    // write header contained in caps
			    clients[c].write('--'+boundary+'\r\n');
			    clients[c].write('Content-Type: ' + mimeType + '\r\n' +
                    'Content-Length: ' + buf.length + '\r\n');
			    clients[c].write('\r\n');
			    /* debug to ensure the jpeg is good
			    if(bOnce == 1) {
    			    fs.writeFile("buffer.jpeg", buf);
    				bOnce = 0;
			    }
			    */
			    
				clients[c].write(buf, 'binary');
				clients[c].write('\r\n');
			}
			pull();
        } else {
            setTimeout(pull, 500);
        }
    });
};

pipeline.play();

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
    'Server': 'Node-GStreamer-MPEGStreamer',
    'Connection': 'close',
    'Expires': 'Fri, 01 Jan 2000 00:00:00 GMT',
    'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Content-Type': 'multipart/x-mixed-replace; boundary=' + boundary
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
