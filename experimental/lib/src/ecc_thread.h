#ifndef _ECC_THREAD_H_
#define _ECC_THREAD_H_

#include "types.h"

namespace cryptogram {

class EccThread {
 public:
  explicit EccThread(int id, int iterations);
  virtual ~EccThread();

  void Start();
  void Join();
  static void* Run(void* context);

  void Done();
  
  int get_id() { return id_; }

 private:
  int id_;
  int iterations_;

  pthread_t thread_;
  
  DISALLOW_COPY_AND_ASSIGN(EccThread);
};


} // namespace cryptogram

#endif  // _ECC_THREAD_H_
