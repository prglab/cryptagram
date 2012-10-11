# README for Closure #

To compile this code on the fly, you'll want to install plovr. 
[Plovr Instructions](http://plovr.com/download.html)

Now run:
java -jar /Users/ispiro/Code/plovr/build/plovr.jar serve closure/cryptogram-config.js

This creates a server on port 9810 that will auto-generate compiled Closure code.
You can access the compiled code on [Localhost](http://localhost:9810/compile?id=cryptogram&mode=advanced)
Open closure/index.html in Chrome and the basic drag & drop should work.

To get the Save to Disk button to work, you need to be running a local webserver.
The easiest option on OS X is to run [MAMP](http://www.mamp.info/en/index.html)

Point the root directory to this directory.
Now you can access the demo at http://localhost:8888/
This requires that the plovr server is running since the served index.html references
http://localhost:9810/compile?id=cryptogram&mode=advanced

Alternatively, load http://localhost:8888/index-compiled.html
This uses the precompiled Closure code so no plovr server is necessary.
