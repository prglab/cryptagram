#!/bin/bash

./build_demo.sh

# Serve with plovr
java -jar ../../plovr/build/plovr.jar serve cryptagram-demo-dev-config.js