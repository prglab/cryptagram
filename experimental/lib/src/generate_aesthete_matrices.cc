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
DEFINE_bool(progress_bar, false, "Display progress bar.");

inline void printProgBar( int percent ){
  std::string bar;

  for(int i = 0; i < 50; i++){
    if( i < (percent/2)){
      bar.replace(i,1,"=");
    }else if( i == (percent/2)){
      bar.replace(i,1,">");
    }else{
      bar.replace(i,1," ");
    }
  }

  std::cout<< "\r" "[" << bar << "] ";
  std::cout.width( 3 );
  std::cout<< percent << "%     " << std::flush;
}

int main(int argc, char** argv) {
  google::ParseCommandLineFlags(&argc, &argv, false);

  srand(0);
  ofstream f_stream(FLAGS_output_file.c_str(), ofstream::binary|ofstream::app);
  std::string to_write;
  for (int i = 0; i < FLAGS_num_matrices; i++) {
    if (FLAGS_progress_bar) {
      printProgBar(static_cast<int>(i / static_cast<float>(FLAGS_num_matrices) *
                                    100));
    }
    
    cryptogram::MatrixRepresentation mr;
    vector<int> discretizations;
    for (int j = 0; j < 16; j++) {
      discretizations.push_back(rand() % 8); // rand() or j.
    }
    mr.InitFromInts(discretizations);
    to_write.append(mr.ToString());
    // LCM 1024 and 6 is 3072. 3072 / 6 = 512. Multiples of 512.
    if (i % 512 == 0) {
      f_stream.write(to_write.c_str(), to_write.size());
      to_write.clear();
    }
  }
  if (to_write.size() > 0) {
    f_stream.write(to_write.c_str(), to_write.size());
  }
  f_stream.close();
  return 0;
}
