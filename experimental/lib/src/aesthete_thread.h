// Copyright 2012. The Cryptogram Authors. BSD-Style License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <pthread.h>

#include <iostream>

namespace cryptogram {

class AestheteRunner {
 public:
  AestheteRunner(int i);

  virtual ~AestheteRunner();

  void Start();

  void Wait();

  static void *Run(void* context) {
    printf("Work %d\n", ((AestheteRunner*)context)->get_i());
    return NULL;
  }

  int get_i() { return i_; }

 private:
  int i_;
  pthread_t thread_;

  AestheteRunner(const AestheteRunner&);                           \
  void operator=(const AestheteRunner&);
};

} // namespace cryptogram
