// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <bitset>
#include <cstdlib>
#include <string>

#include "aesthete.h"
#include "aesthete_thread.h"
#include "glog/logging.h"
#include "threadsafe_queue.h"

const int kQueueChunkSize = 1000;

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);

  ThreadsafeQueue<vector<bitset<48> > > queue(5);

  cryptogram::AestheteReader ar(0, &queue);
  ar.Start();

  vector<cryptogram::AestheteRunner*> runners;
  for (int i = 0; i < 10; i++) {
    runners.push_back(new cryptogram::AestheteRunner(i, &queue));
  }
  for (int i = 0; i < 10; i++) {
    runners[i]->Start();
  }
  
  ar.Join();
  
  for (int i = 0; i < 10; i++) {
    runners[i]->Done();
  }
  for (int i = 0; i < 10; i++) {
    runners[i]->Join();
  }
  return 0;
}
