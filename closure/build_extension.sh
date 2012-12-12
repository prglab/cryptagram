#!/bin/bash

# Setup paths
BUILD_DIR=build
STATIC_DIR=static
EXTENSION_BUILD_DIR=${BUILD_DIR}/chrome-extension
EXTENSION_STATIC_DIR=${STATIC_DIR}/chrome-extension

# Delete old
echo "Replacing build directory."
rm -rf ${EXTENSION_BUILD_DIR}

# Create build directories.
mkdir -p ${EXTENSION_BUILD_DIR}

# Add static content
echo "Copying static content."
cp -r ${EXTENSION_STATIC_DIR}/* ${EXTENSION_BUILD_DIR}/

# Compile with plovr
echo "plovr compilation: background."
java -jar ../../plovr/build/plovr.jar build cryptogram-background-config.js > ${EXTENSION_BUILD_DIR}/cryptogram-background.js
echo "plovr compilation: content."
java -jar ../../plovr/build/plovr.jar build cryptogram-content-config.js > ${EXTENSION_BUILD_DIR}/cryptogram-content.js

# Zip the extension for upload.
echo "Packaging."
cd $BUILD_DIR
zip -r cryptagram.zip chrome-extension
cd -

echo "Done."
