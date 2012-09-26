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

# Compile with plovr
java -jar ../../plovr/build/plovr.jar build cryptogram-demo-config.js > build/demo/cryptogram-compiled.js