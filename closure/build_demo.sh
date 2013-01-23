#!/bin/bash

#Setup paths
BUILD_DIR=build
STATIC_DIR=static
DEMO_BUILD_DIR=${BUILD_DIR}/demo
DEMO_STATIC_DIR=${STATIC_DIR}/demo

#Delete old
rm -rf ${DEMO_BUILD_DIR}

# Create build directories.
mkdir -p ${DEMO_BUILD_DIR}

# Add static content
cp -r ${DEMO_STATIC_DIR}/* ${DEMO_BUILD_DIR}/

java -jar ../../plovr/lib/closure-stylesheets.jar --pretty-print --output-renaming-map-format CLOSURE_COMPILED --rename CLOSURE --output-renaming-map src/closure/renaming_map.js  --output-file  ${DEMO_BUILD_DIR}/style.css gss/demo.gss

# Compile with plovr
java -jar ../../plovr/build/plovr.jar build cryptagram-demo-config.js > build/demo/cryptagram-compiled.js