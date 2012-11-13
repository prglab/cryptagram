#!/bin/bash

cd 
rm -rf cryptogram-1.0
tar xvf cryptogram-1.0.tar.gz 
cd cryptogram-1.0 
./configure --with-tcmalloc
make -j16 CXXFLAGS="-I$HOME/include" LDFLAGS="-L$HOME/lib" V=1

echo " Ready to roll at "
echo "   ~/cryptogram-1.0/src/in_memory_experiment"
echo "   ~/cryptogram-1.0/src/ecc_experiment_main"
