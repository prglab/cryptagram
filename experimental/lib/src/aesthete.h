// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)
// 
// Generate the matrices and write them to disk. We then post process by sorting
// and unique-ing the output values.
//
// ./aesthete > output.txt
//

#include <bitset>
#include <cassert>
#include <iostream>
#include <vector>
#include <sstream>

#include "glog/logging.h"

using std::cout;
using std::endl;
using std::string;
using std::ostringstream;
using std::bitset;
using std::vector;

namespace cryptogram {

template<size_t N>
vector<unsigned char> bitset_to_bytes(const std::bitset<N>& bs)
{
  vector<unsigned char> result((N + 7) >> 3);
  for (int j=0; j<int(N); j++)
    result[j>>3] |= (bs[j] << (j & 7));
  return result;
}

// NOTE: This code does not actually compile because the value of N for
// std::bitset<N> cannot be determined until runtime (and templates must know
// their expansions at compile time).
// 
// template<size_t N>
// std::bitset<N> bitset_from_bytes(const vector<unsigned char>& buf)
// {
//   assert(buf.size() == ((N + 7) >> 3));
//   std::bitset<N> result;
//   for (int j=0; j<int(N); j++)
//     result[j] = ((buf[j>>3] >> (j & 7)) & 1);
//   return result;
// }

struct CompactMatrix {
  bitset<48> bits;
};

class MatrixRepresentation {
 public:
  MatrixRepresentation();
  
  virtual ~MatrixRepresentation();

  void InitFromString(const char* input);

  // Vector of ints that fill the 4x4 matrix left to right and top to bottom.
  void InitFromInts(const vector<int>& values);
  
  // h and w correspond to the 4 x 4 grid of 2x2 blocks in the 8x8 JPEG
  // matrix. Consequently, an index of
  int operator()(int x, int y);
  
  string ToString();
  void ToInts(vector<int>* output);
  
 private:
  CompactMatrix matrix_;

  MatrixRepresentation(const MatrixRepresentation&);                           \
  void operator=(const MatrixRepresentation&);
};

} // namespace cryptogram
