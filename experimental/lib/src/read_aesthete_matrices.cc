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

DEFINE_int32(threads, 1, "Number of threads.");
DEFINE_string(input_file, "matrices.txt", "Input file for matrices.");
DEFINE_bool(no_quit, false, "Do not quit when queue is empty.");

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);
  google::ParseCommandLineFlags(&argc, &argv, false);
      
  Queue queue(0);

  cryptogram::AestheteReader reader(FLAGS_input_file, 0, &queue);
  reader.Start();

  vector<cryptogram::AestheteRunner*> runners;
  for (int i = 0; i < FLAGS_threads; i++) {
    runners.push_back(new cryptogram::AestheteRunner(i, &queue));
  }
  for (int i = 0; i < FLAGS_threads; i++) {
    runners[i]->Start();
  }

  while (FLAGS_no_quit) {
    std::cout << "Waiting indefinitely..." << std::endl;
    sleep(1);
  }

  std::cout << "All threads started. Now waiting for job queue to be "
            << "exhausted." << std::endl;
  queue.join();

  reader.Done();
  reader.Join();

  for (int i = 0; i < FLAGS_threads; i++) {
    runners[i]->Done();
  }
  for (int i = 0; i < FLAGS_threads; i++) {
    runners[i]->Join();
  }
  return 0;
}
