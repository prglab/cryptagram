#include "aesthete_thread.h"

#include "glog/logging.h"

namespace cryptogram {

AestheteRunner::AestheteRunner(int i) : i_(i) {
}

AestheteRunner::~AestheteRunner() {
}

void AestheteRunner::Start() {
  CHECK_EQ(pthread_create(&thread_, NULL, &AestheteRunner::Run, this), 0);
}

void AestheteRunner::Wait() {
  CHECK_EQ(pthread_join(thread_, NULL), 0);
}

} // namespace cryptogram
