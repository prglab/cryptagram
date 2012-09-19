#ifndef _UTIL_H_
#define _UTIL_H_

#include <vector>

#include "glog/logging.h"

namespace cryptogram {

const int kBytesPerWidthEntry = 3;      // Byte per R, G, B.

inline bool UcharVectorToArray(const std::vector<unsigned char>& input,
                               const int output_capacity,
                               unsigned char* output) {
  CHECK_EQ(output_capacity, input.size());

  for (int i = 0; i < output_capacity; i++) {
    output[i] = input[i];
  }
  return true;
}

} // namespace cryptogram

#endif  // _UTIL_H_
