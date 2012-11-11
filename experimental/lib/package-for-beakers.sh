#!/bin/bash

rm cryptogram-1.0.tar.gz
make distcheck DISTCHECK_CONFIGURE_FLAGS=--with-tcmalloc DIST_CONFIGURE_FLAGS=--with-tcmalloc -j4
cp cryptogram-1.0.tar.gz /nfs
