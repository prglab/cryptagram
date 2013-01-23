# Downloadify Build Script
#
# ispiro@gmail.com
#
# Get SDK here: http://download.macromedia.com/pub/flex/sdk/flex_sdk_4.6.
# 

FCSH=../../flex_sdk_4.6/bin/fcsh

echo "mxmlc -o=media/downloadify.swf -file-specs=src/Downloadify.as" | $FCSH