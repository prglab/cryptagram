// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <bitset>
#include <cstdlib>
#include <string>

#include "aesthete.h"
#include "aesthete_thread.h"
#include "glog/logging.h"
#include "google/gflags.h"
#include "queue.h"

const int kQueueChunkSize = 1000;

DEFINE_int32(threads, 1, "Number of threads.");
DEFINE_string(input_file, "matrices.txt", "Input file for matrices.");

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);
  google::ParseCommandLineFlags(&argc, &argv, false);
      
  ThreadsafeQueue<int> queue(1 << 20);

  cryptogram::AestheteReader reader(FLAGS_input_file, 0, &queue);
  reader.Start();

  vector<cryptogram::AestheteRunner*> runners;
  for (int i = 0; i < FLAGS_threads; i++) {
    runners.push_back(new cryptogram::AestheteRunner(i, &queue));
  }
  for (int i = 0; i < FLAGS_threads; i++) {
    runners[i]->Start();
  }
  
  reader.Join();

  // for (int i = 0; i < FLAGS_threads; i++) {
  //   runners[i]->Done();
  // }
  for (int i = 0; i < FLAGS_threads; i++) {
    runners[i]->Join();
  }
  return 0;
}
