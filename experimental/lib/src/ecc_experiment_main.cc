// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <cstring>
#include <iostream>
#include <set>
#include <vector>

#include "aesthete.h"
#include "array.h"
#include "boost/numeric/ublas/io.hpp"
#include "discretizations.h"
#include "ecc_experiment.h"
#include "ecc_image.h"
#include "ecc_message.h"
#include "ecc_thread.h"
#include "glog/logging.h"
#include "google/gflags.h"
#include "jpeg_codec.h"
#include "reentrant_rand.h"
#include "reed_solomon/rs_codec.h"

// Profiler headers.
/*
#include "gperftools/profiler.h"
#include "gperftools/heap-profiler.h"
*/

DEFINE_int32(quality, 95, "JPEG quality to use.");
DEFINE_int64(iterations, 2, "Number of iterations to run.");
DEFINE_int32(num_threads, 1, "Number of threads.");

namespace cryptogram {

const int ByteSize = 8;

void PrintTwoByteInt(uint16_t num) {
  std::cout << std::endl;
  std::cout << "Printing Little Endian: '" << num << "'." << std::endl;
  for (int ii = 0; ii < 16; ii++) {
    int tmp = (num >> ii) & 1;
    std::cout << tmp;
  }
  std::cout << std::endl;
}

unsigned int CountErrors(const matrix<double>& matrix_a,
                         const matrix<double>& matrix_b,
                         int threshold) {
  CHECK_EQ(matrix_a.size1(), 4);
  CHECK_EQ(matrix_a.size2(), 4);
  CHECK_EQ(matrix_b.size1(), 4);
  CHECK_EQ(matrix_b.size2(), 4);

  matrix<unsigned char> diff = matrix_a - matrix_b;
  unsigned int nerrors = 0;
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      if (abs((int)(char)diff(i,j)) >= threshold) {
        nerrors++;
      }
    }
  }
  return nerrors;
}


void Foo() {
  srand(time(NULL));

  vector<EccThread *> experiment_threads;
  int iterations_per_thread = FLAGS_iterations / FLAGS_num_threads;
  std::cout << "Iterations per thread: " << iterations_per_thread << std::endl;
  for (int i = 0; i < FLAGS_num_threads; i++) {
    experiment_threads.push_back(new EccThread(i, iterations_per_thread));
  }
  
  for (int i = 0; i < FLAGS_num_threads; i++) {
    experiment_threads[i]->Start();
  }
  
  for (int i = 0; i < FLAGS_num_threads; i++) {
    experiment_threads[i]->Join();
  }

  for (int i = 0; i < FLAGS_num_threads; i++) {
    delete experiment_threads[i];
  }
}
} // namespace cryptogram

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);
  google::ParseCommandLineFlags(&argc, &argv, false);
  /*
  ProfilerStart("ecc_experiment.prof");
  HeapProfilerStart("ecc_experiemnt.hprof");
  */
  cryptogram::Foo();
  /*
  HeapProfilerDump("lastreason");
  HeapProfilerStop();
  ProfilerStop();
  */

  return 0;
}
