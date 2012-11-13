#include "reentrant_rand.h"

#include <cstdlib>
#include <cstring>
#include <ctime>
#include <pthread.h>

namespace cryptogram {

ReentrantRNG::ReentrantRNG() {
  unsigned int seed = time(NULL);
  memcpy(state_, &seed, sizeof(seed));
  srand48(time(NULL));
}

ReentrantRNG::~ReentrantRNG() {
}

char ReentrantRNG::RandChar() {
  return static_cast<char>(nrand48(state_) % kCharMax);
}

} // namespace cryptogram
