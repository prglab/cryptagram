#ifndef _REENTRANT_RAND_H_
#define _REENTRANT_RAND_H_

#ifdef __gnu_linux__
#include <cstdlib>
#include <ctime>
#endif

namespace cryptogram {

const int kCharMax = 256;

class ReentrantRNG {
 public:
// #ifdef __gnu_linux__
//   static void SeedRNG();
//   static char RandChar();
// #endif  // __gnu_linux__

  // Seeds the internal state for the thread-safe prng.
  ReentrantRNG();
  virtual ~ReentrantRNG();
  
  char RandChar();
  
 private:
  unsigned short state_[3];
};

// #ifdef __gnu_linux__
// inline void ReentrantRNG::SeedRNG() {
//   struct drand48_data randBuffer;
//   srand48_r(time(NULL), &randBuffer);
// }

// inline char ReentrantRNG::RandChar() {
//   double rand_double = 0;
//   struct drand48_data rand_buffer;
//   drand48_r(&rand_buffer, &rand_double);
//   return static_cast<char>(static_cast<int>(rand_double * kCharMax));
// }
// #endif  // __gnu_linux__

} // namespace cryptogram

#endif  //  _REENTRANT_RAND_H_
