#!/bin/bash

#Setup paths
BUILD_DIR=build
STATIC_DIR=static
EXTENSION_BUILD_DIR=${BUILD_DIR}/chrome-extension
EXTENSION_STATIC_DIR=${STATIC_DIR}/chrome-extension

#Delete old
rm -rf ${EXTENSION_BUILD_DIR}

# Create build directories.
mkdir -p ${EXTENSION_BUILD_DIR}

# Add static content
cp -r ${EXTENSION_STATIC_DIR}/* ${EXTENSION_BUILD_DIR}/

# Compile with plovr
java -jar ../../plovr/build/plovr.jar build cryptogram-background-config.js > ${EXTENSION_BUILD_DIR}/cryptogram-background.js
java -jar ../../plovr/build/plovr.jar build cryptogram-content-config.js > ${EXTENSION_BUILD_DIR}/cryptogram-content.js
