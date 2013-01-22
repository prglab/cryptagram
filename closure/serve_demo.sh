#!/bin/bash

# Need to delete the renaming map for CSS to work
echo > src/closure/renaming_map.js

# Serve with plovr
java -jar ../../plovr/build/plovr.jar serve cryptagram-demo-config.js