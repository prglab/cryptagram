#include "reentrant_rand.h"

#include <cstdlib>
#include <cstring>
#include <ctime>
#include <pthread.h>

namespace cryptogram {

ReentrantRNG::ReentrantRNG() {
  unsigned int seed = time(NULL);
  memcpy(state_, &seed, sizeof(seed));
}

ReentrantRNG::~ReentrantRNG() {
}

#ifndef __gnu_linux__
char ReentrantRNG::RandChar() {
  return static_cast<char>(nrand48(state_) % kCharMax);
}
#endif  // __gnu_linux__

} // namespace cryptogram
