#!/bin/bash

# Setup paths
BUILD_DIR=build
STATIC_DIR=static
ENCODER_BUILD_DIR=${BUILD_DIR}/encoder
ENCODER_STATIC_DIR=${STATIC_DIR}/encoder

# Delete old
rm -rf ${ENCODER_BUILD_DIR}

# Create build directories.
mkdir -p ${ENCODER_BUILD_DIR}

# Add static content
cp -r ${ENCODER_STATIC_DIR}/* ${ENCODER_BUILD_DIR}/

java -jar ../../plovr/lib/closure-stylesheets.jar \
		--pretty-print \
		--output-renaming-map-format CLOSURE_COMPILED \
		--rename CLOSURE \
		--output-renaming-map src/closure/renaming_map.js \
		--output-file ${ENCODER_BUILD_DIR}/style.css gss/encoder.gss

# Compile with plovr
java -jar ../../plovr/build/plovr.jar \
		build \
		cryptagram-encoder-config.js > build/encoder/cryptagram-compiled.js
