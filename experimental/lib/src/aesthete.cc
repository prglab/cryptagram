// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)
//
// Generate the matrices and write them to disk. We then post process by sorting
// and unique-ing the output values.
//
// ./aesthete > output.txt
//

#include "aesthete.h"

namespace cryptogram {

MatrixRepresentation::MatrixRepresentation() {
}

MatrixRepresentation::~MatrixRepresentation() {
}

void MatrixRepresentation::InitFromString(const char* input) {
  // TODO(tierney): Must enforce the length of six.
  for (int j = 0; j < 48; j++) {
    bits_[j] = ((input[j>>3] >> (j & 7)) & 1);
  }
}

void MatrixRepresentation::InitFromInts(const vector<int>& values) {
  CHECK_EQ(values.size(), 16);
  const int kNumDiscretizations = 8;
  for (int i = 0; i < values.size(); i++) {
    const int val = values[i];
    CHECK_GE(val, 0);
    CHECK_LE(val, kNumDiscretizations);

    const int idx = i * 3;
    bits_[idx + 0] = values[i] & 1;
    bits_[idx + 1] = values[i] & 2;
    bits_[idx + 2] = values[i] & 4;
  }
}

int MatrixRepresentation::operator()(int x, int y) {
  const int kWidth = 4 * 3;

  bitset<3> value;
  int start_idx = y * kWidth + x * 3;
  value[0] = bits_[start_idx + 0];
  value[1] = bits_[start_idx + 1];
  value[2] = bits_[start_idx + 2];

  vector<unsigned char> single_char = bitset_to_bytes(value);
  CHECK_EQ(single_char.size(), 1);
  return static_cast<int>(single_char[0]);
}

void MatrixRepresentation::ToInts(vector<int>* output) {
  CHECK_NOTNULL(output);

  for (int i = 0; i < 16; i++) {
    output->push_back((*this)(i % 4, i / 4));
  }
}

string MatrixRepresentation::ToString() {
  vector<unsigned char> chars = bitset_to_bytes(bits_);
  string ret(chars.begin(), chars.end());
  return ret;
}

} // namespace cryptogram
