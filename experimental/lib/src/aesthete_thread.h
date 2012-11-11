// Copyright 2012. The Cryptogram Authors. BSD-Style License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#ifndef _AESTHETE_THREAD_H_
#define _AESTHETE_THREAD_H_

#include <bitset>
#include <fstream>
#include <iostream>
#include <pthread.h>
#include <string>

#include "queue.h"
#include "types.h"

using std::string;

namespace cryptogram {

class AestheteRunner {
 public:
  AestheteRunner(int id, int total_num_matrices, Queue* queue);
  virtual ~AestheteRunner();

  void Start();
  void Join();
  static void* Run(void* context);

  void Done();
  
  Queue* queue() { return queue_; }
  int get_id() { return id_; }

 private:
  int id_;
  bool done_;
  int total_num_matrices_;
  pthread_t thread_;
  Queue* queue_;

  DISALLOW_COPY_AND_ASSIGN(AestheteRunner);
};

// AestheteReader aims to read data off of disk and push chunks of that data
// into a queue that will be accessible to multiple processing threads.
class AestheteReader {
 public:
  AestheteReader(const string& filename, int id, Queue* queue);
  virtual ~AestheteReader();

  void Start();
  void Done();
  void Join();
  static void* Run(void* context);
  Queue* queue() { return queue_; }
  
 private:
  string filename_;
  bool done_;
  int id_;
  pthread_t thread_;
  Queue* queue_;
  
  DISALLOW_COPY_AND_ASSIGN(AestheteReader);
};

namespace aesthete {

class Generator {
 public:
  Generator(int id, int num_matrices, int chunk_size, Queue* queue);
  virtual ~Generator();

  void Start();
  void Join();

  static void* Run(void* context);

 private:
  int id_;
  int num_matrices_;
  int chunk_size_;
  pthread_t thread_;
  Queue* queue_;

  DISALLOW_COPY_AND_ASSIGN(Generator);  
};

class ECCGenerator {
 public:
  ECCGenerator(int id, int num_matrices, int chunk_size, Queue* queue);
  virtual ~ECCGenerator();

  void Start();
  void Join();

  static void* Run(void* context);

 private:
  int id_;
  int num_matrices_;
  int chunk_size_;
  pthread_t thread_;
  Queue* queue_;

  DISALLOW_COPY_AND_ASSIGN(ECCGenerator);  
};

} // namespace aesthete
} // namespace cryptogram

#endif  // _AESTHETE_THREAD_H_
