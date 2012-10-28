#!/bin/bash

./build_extension.sh
rm -rf build/chrome-extension-dev
cp -r build/chrome-extension build/chrome-extension-dev
cp static/chrome-extension-dev/* build/chrome-extension-dev/.

PORT=2012
java -jar ../../plovr/build/plovr.jar serve --port ${PORT} cryptogram-content-config.js