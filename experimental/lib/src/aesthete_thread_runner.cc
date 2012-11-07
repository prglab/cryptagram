// Copyright 2012. The Cryptogram Authors. BSD-Style License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include "aesthete_thread.h"

int main(int argc, char** argv) {
  cryptogram::AestheteRunner* ars[100];
  for (int i = 0; i < 100; i++) {
    ars[i] = new cryptogram::AestheteRunner(i);
  }
  for (int i = 0; i < 100; i++) {
    ars[i]->Start();
  }
  for (int i = 0; i < 100; i++) {
    ars[i]->Wait();
  }
  for (int i = 0; i < 100; i++) {
    delete ars[i];
  }
  return 0;
}
