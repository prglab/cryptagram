// Copyright 2012. The Cryptogram Authors. BSD-Style License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <pthread>

class AestheteRunner {
 public:
  AestheteRunner(int i) : i_(i) {}

  virtual ~AestheteRunner() {}

  void Start() {
    CHECK_EQ(pthread_create(&thread_, NULL, &AestheteRunner::Run, this), 0);
  }

  void Wait() {
    pthread_join
  }

  void Run() {
    printf("Work %d\n", i_);
  }

 private:
  int i_;
  pthread_t thread_;

  AestheteRunner(const AestheteRunner&);                           \
  void operator=(const AestheteRunner&);
};
