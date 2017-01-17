# node-gstreamer-mp4-streamer

This is an attempt to stream mp4 streams by dumping them to the html response. A good working solution hasn't been found.

server.js will create a stream that can be loaded and will play in vlc with the url http://yourserver:8001/stream. This is pretty similar to [Stream live WebM video to browser using Node.js and GStreamer](https://delog.wordpress.com/2011/04/26/stream-live-webm-video-to-browser-using-node-js-and-gstreamer/) particuarly the mp4 in the comments. 

server.1.js is an attempts to stream the mp4 similar to how m-jpeg streams are sent. I thought it was a good idea but also doesn't work. It hung firefox on load a few times. 


