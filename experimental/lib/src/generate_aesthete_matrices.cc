// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <cstdlib>
#include <fstream>
#include <iostream>

#include "aesthete.h"
#include "google/gflags.h"
#include "types.h"

DEFINE_int64(num_matrices, 100, "Number of matrices to generate.");
DEFINE_string(output_file, "matrices.txt", "Output file.");

int main(int argc, char** argv) {
  google::ParseCommandLineFlags(&argc, &argv, false);

  srand(0);

  ofstream f_stream(FLAGS_output_file.c_str(), ofstream::binary);
  for (int i = 0; i < FLAGS_num_matrices; i++) {
    cryptogram::MatrixRepresentation mr;
    vector<int> discretizations;
    for (int j = 0; j < 16; j++) {
      discretizations.push_back(rand() % 8); // rand() or j.
    }
    mr.InitFromInts(discretizations);
    f_stream << mr.ToString();
  }
  return 0;
}
