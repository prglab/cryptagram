// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <string>

#include "aesthete.h"
#include "glog/logging.h"

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);
  // Read six bytes at a time.
  std::filebuf in_file;
  in_file.open("test", std::ios::in);

  cryptogram::MatrixRepresentation mr;
  char matrix[7];
  vector<int> ints;
  for (int j = 0; j < 10000000; j++) {
    // Run it through the cryptogram::MatrixRepresentation to get the
    // discretizations.
    bzero(matrix, 7);
    in_file.sgetn(matrix, 6);
    mr.InitFromString(matrix);
    mr.ToInts(&ints);

    std::cout << j << " : ";
    for (int i = 0; i < 16; i++) {
      std::cout << ints[i] << " ";
    }
    std::cout << std::endl;
  }
}
