#ifndef _QUEUE_H_
#define _QUEUE_H_

#include <deque>
#include <pthread.h>

#include "glog/logging.h"

template<typename T>
class Queue {
 public:
  explicit Queue(int maxsize) : maxsize_(maxsize), unfinished_tasks_(0) {
    CHECK_EQ(pthread_cond_init(&all_tasks_done_, NULL), 0);
    CHECK_EQ(pthread_cond_init(&not_empty_, NULL), 0);
    CHECK_EQ(pthread_cond_init(&not_full_, NULL), 0);
    CHECK_EQ(pthread_mutex_init(&mutex_, NULL), 0);
  }

  virtual ~Queue() {
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

  
  
  
 private:
  pthread_cond_t all_tasks_done_;
  pthread_cond_t not_empty_;
  pthread_cond_t not_full_;
  pthread_mutex_t mutex_;
  int unfinished_tasks_;
  int maxsize_;

  std::deque<T> queue_;
};

#endif  // _QUEUE_H_
