#ifndef _REENTRANT_RAND_H_
#define _REENTRANT_RAND_H_

namespace cryptogram {

const int kCharMax = 256;

class ReentrantRNG {
 public:
  static void SeedRNG();
  static char RandChar();
};

inline void ReentrantRNG::SeedRNG() {
  struct drand48_data randBuffer;
  srand48_r(time(NULL), &randBuffer);
}

inline char ReentrantRNG::RandChar() {
  double rand_double = 0;
  struct drand48_data rand_buffer;
  drand48_r(&rand_buffer, &rand_double);
  return static_cast<char>(static_cast<int>(rand_double * kCharMax));
}


} // namespace cryptogram

#endif  //  _REENTRANT_RAND_H_
