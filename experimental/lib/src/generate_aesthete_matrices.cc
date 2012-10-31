// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <cstdlib>

#include "aesthete.h"

int main(int argc, char** argv) {
  srand(0);
  for (int i = 0; i < 10000000; i++) {
    cryptogram::MatrixRepresentation mr;
    vector<int> discretizations;
    for (int j = 0; j < 16; j++) {
      discretizations.push_back(j % 8);
    }
    mr.InitFromInts(discretizations);
    cout << mr.ToString();
  }
  return 0;
}
