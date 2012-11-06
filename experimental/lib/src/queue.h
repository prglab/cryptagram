// Copyright 2012. Matt Tierney. BSD Style License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#ifndef _QUEUE_H_
#define _QUEUE_H_

#include <ctime>
#include <deque>
#include <pthread.h>
#include <sys/time.h>

#include "glog/logging.h"
#include "types.h"

// This Queue class follows the concurrency patterns and API of the python Queue
// collection. The user may specify a maximum size for the internal queue
// storage.
//
// This class currently contains a hard-coded underlying storage
// container, the std::deque.
//
// This class is thread-safe.
class Queue {
 public:
  explicit Queue(uint64 maxsize) : maxsize_(maxsize), unfinished_tasks_(0) {
    CHECK_EQ(pthread_cond_init(&all_tasks_done_, NULL), 0);
    CHECK_EQ(pthread_cond_init(&not_empty_, NULL), 0);
    CHECK_EQ(pthread_cond_init(&not_full_, NULL), 0);
    CHECK_EQ(pthread_mutex_init(&mutex_, NULL), 0);
  }

  virtual ~Queue() {
    CHECK_EQ(pthread_cond_destroy(&all_tasks_done_), 0);
    CHECK_EQ(pthread_cond_destroy(&not_empty_), 0);
    CHECK_EQ(pthread_cond_destroy(&not_full_), 0);
    CHECK_EQ(pthread_mutex_destroy(&mutex_), 0);
    CHECK_EQ(queue_.size(), 0) << "Queue should be empty.";
  }

  void task_done() {
    CHECK_EQ(pthread_mutex_lock(&mutex_), 0);
    int unfinished = unfinished_tasks_ - 1;
    if (unfinished <= 0) {
      if (unfinished < 0) {
        LOG(FATAL) << "ValueError task_done() called too many times.";
      }
      pthread_cond_broadcast(&all_tasks_done_);
    }
    unfinished_tasks_ = unfinished;
    CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
  }

  void join() {
    CHECK_EQ(pthread_mutex_lock(&mutex_), 0);
    while (unfinished_tasks_ > 0) {
      pthread_cond_wait(&all_tasks_done_, &mutex_);
    }
    CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
  }

  int qsize() {
    CHECK_EQ(pthread_mutex_lock(&mutex_), 0);
    int n = queue_.size();
    CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
    return n;
  }

  bool empty() {
    CHECK_EQ(pthread_mutex_lock(&mutex_), 0);
    bool ret = queue_.size() > 0 ? false : true;
    CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
    return ret;
  }

  bool full() {
    CHECK_EQ(pthread_mutex_lock(&mutex_), 0);
    bool ret = 0 < queue_.size() == maxsize_;
    CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
    return ret;
  }

  // Return value is false indicates an error occurred.
  bool put(void* value, bool block, time_t timeout) {
    CHECK_EQ(pthread_mutex_lock(&mutex_), 0);
    if (maxsize_ > 0) {
      if (!block) {
        if (queue_.size() == maxsize_) {
          LOG(ERROR) << "Queue is full.";
          CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
          return false;
        } else if (timeout == 0) {
          while (queue_.size() == maxsize_) {
            pthread_cond_wait(&not_full_, &mutex_);
          }
        } else if (timeout < 0) {
          CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
          LOG(FATAL) << "'timeout' must be a positive number";
        } else {
          time_t endtime = time(NULL) + timeout;
          while (queue_.size() == maxsize_) {
            time_t remaining = endtime - time(NULL);
            if (remaining <= 0.0) {
              CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
              return false;
            }

            // Following example from 'man pthread_cond_timedwait' to figure out
            // what is the remaining time to call a pthread conditional variable
            // timed wait.
            struct timeval tv;
            struct timespec ts;
            gettimeofday(&tv, NULL);
            ts.tv_sec = tv.tv_sec + remaining;
            ts.tv_nsec = 0;

            pthread_cond_timedwait(&not_full_, &mutex_, &ts);
          }
        }

      }
    }
    queue_.push_back(value);
    unfinished_tasks_++;
    pthread_cond_signal(&not_empty_);
    CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
  }

  bool put_nowait(void* value) {
    return put(value, false, 0);
  }

  // Caller should check if the return value is NULL, indicating an error
  // occurred. @timeout == 0 means that no timeout is used.
  void* get(bool block, time_t timeout) {
    CHECK_EQ(pthread_mutex_lock(&mutex_), 0);
    if (!block) {
      if (0 == queue_.size()) {
        CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
        return NULL;
      }
    } else if (timeout == 0) {
      while (queue_.size() == 0) {
        pthread_cond_wait(&not_empty_, &mutex_);
      }
    } else if (timeout < 0) {
      CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
      LOG(FATAL) << "'timeout' must be a positive number";
    } else {
      time_t endtime = time(NULL) + timeout;
      while (0 == queue_.size()) {
        time_t remaining = endtime - time(NULL);
        if (remaining <= 0.0) {
          CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
          return NULL;
        }
        pthread_cond_wait(&not_empty_, &mutex_);
      }
    }

    void *value = queue_.front();
    queue_.pop_front();
    
    pthread_cond_signal(&not_full_);
    CHECK_EQ(pthread_mutex_unlock(&mutex_), 0);
    return value;
  }

  void* get_nowait() {
    return get(false, 0);
  }

 private:
  pthread_cond_t all_tasks_done_;
  pthread_cond_t not_empty_;
  pthread_cond_t not_full_;
  pthread_mutex_t mutex_;

  uint64 maxsize_;
  int unfinished_tasks_;

  std::deque<void *> queue_;

  // DISALLOW_COPY_AND_ASSIGN(Queue);
  Queue(const Queue&);
  void operator=(const Queue&);
};

#endif  // _QUEUE_H_
