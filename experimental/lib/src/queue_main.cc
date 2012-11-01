// Copyright 2012 The Cryptogram Authors.

#include <deque>
#include <iostream>

#include "glog/logging.h"
#include "queue.h"

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);

  LOG(ERROR) << "hi";
  Queue<int> queue(10);

  int one = 1;
  int two = 2;
  int three = 3;
  queue.put(one);
  queue.put(two);
  queue.put(three);
  
  std::string pempty = queue.empty() ? "empty" : "not empty";
  LOG(ERROR) << "Hello: " << pempty;

  while (!queue.empty()) {
    std::cout << queue.get() << std::endl;
  }
  
  return 0;
}
