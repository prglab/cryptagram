#!/bin/sh
echo data\;param p := $1\;end\; > test.dat

glpsol -m test.mod -d test.dat
