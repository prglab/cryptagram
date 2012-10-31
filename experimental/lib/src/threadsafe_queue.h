// Copyright 2012. The Cryptogram Authors. BSD-Style License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

// Copyright 2006 Google Inc. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// queue.h : simple queue api

// This is an interface to a simple thread safe queue,
// used to hold data blocks and patterns.
// The order in which the blocks are returned is random.

#ifndef _THREADSAFE_QUEUE_H_
#define _THREADSAFE_QUEUE_H_

#include <sys/types.h>
#include <pthread.h>

#include "glog/logging.h"
#include "types.h"

// This is a threadsafe randomized queue of pages for
// worker threads to use.
template<typename T>
class ThreadsafeQueue {
 public:
  explicit ThreadsafeQueue(uint64 queuesize) {
    // There must always be one empty queue location,
    // since in == out => empty.
    q_size_ = queuesize + 1;
    objects_ = new T[q_size_];
    nextin_ = 0;
    nextout_ = 0;
    popped_ = 0;
    pushed_ = 0;
    pthread_mutex_init(&q_mutex_, NULL);
  }
  
  ~ThreadsafeQueue() {
    delete[] objects_;
    pthread_mutex_destroy(&q_mutex_);
  }

  // Push a page onto the list.
  int Push(T *obj) {
    int result = 0;
    int64 nextnextin;

    if (!obj)
      return 0;

    pthread_mutex_lock(&q_mutex_);
    nextnextin = (nextin_ + 1) % q_size_;

    if (nextnextin != nextout_) {
      objects_[nextin_] = *obj;

      nextin_ = nextnextin;
      result = 1;

      pushed_++;
    }

    pthread_mutex_unlock(&q_mutex_);

    return result;
  }
  
  // Pop a random page off of the list.
  int PopRandom(T *obj) {
    int result = 0;
    int64 lastin;
    int64 entries;
    int64 newindex;
    T tmp;

    if (!obj) {
      return 0;
    }
    
    // TODO(nsanders): we should improve random to get 64 bit randoms, and make
    // it more thread friendly.
    uint64 rand = random();

    int retval = pthread_mutex_lock(&q_mutex_);
    if (retval) {
      LOG(ERROR) << "Process Error: pthreads mutex failure " << retval;
    }
    
    if (nextin_ != nextout_) {
      // Randomized fetch.
      // Swap random entry with next out.
      {
        lastin = (nextin_ - 1 + q_size_) % q_size_;
        entries = (lastin - nextout_ + q_size_) % q_size_;

        newindex = nextout_;
        if (entries) {
          newindex = ((rand % entries) + nextout_) % q_size_;
        }
        
        // Swap the pages.
        tmp = objects_[nextout_];
        objects_[nextout_] = objects_[newindex];
        objects_[newindex] = tmp;
      }

      // Return next out page.
      *obj = objects_[nextout_];

      nextout_ = (nextout_ + 1) % q_size_;
      result = 1;

      popped_++;
    }

    pthread_mutex_unlock(&q_mutex_);
    return result;
  }

 private:
  T *objects_;  // Where the objects are held.
  int64 nextin_;
  int64 nextout_;
  int64 q_size_;  // Size of the queue.
  int64 pushed_;  // Number of pages pushed, total.
  int64 popped_;  // Number of pages popped, total.
  pthread_mutex_t q_mutex_;

  ThreadsafeQueue(const ThreadsafeQueue&);                      \
  void operator=(const ThreadsafeQueue&);
};

#endif  // _THREADSAFE_QUEUE_H_
