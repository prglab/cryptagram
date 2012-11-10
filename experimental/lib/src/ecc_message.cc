// Copyright 2012. The Cryptogram Authors. BSD Style License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include "ecc_message.h"

#include <assert.h>
#include <limits.h>

#include <iostream>

#include "glog/logging.h"

namespace cryptogram {

EccMessage::EccMessage() {
  memset(bytes_, 0, sizeof(bytes_));
  memset(first_message_, 0, sizeof(first_message_));
  memset(first_parity_, 0, sizeof(first_parity_));
  memset(second_message_, 0, sizeof(second_message_));
  memset(second_parity_, 0, sizeof(second_parity_));
}

EccMessage::~EccMessage() {
}

void EccMessage::SetMessage(uint8_t *message, Position pos) {
  memcpy(bytes_ + (pos * kRs255_223TotalBytes),
         message,
         kRs255_223MessageBytes);
}

void EccMessage::SetParity(uint16_t *parity, Position pos) {
  // std::cout << "SetParity: " << std::endl;
  for (int i = 0, pos_i = pos * kRs255_223TotalBytes;
       i < kParityArraySize;
       i++, pos_i += 1) {
    // Sanity check that the parity values, even though they are stored in
    // uint16_t have a size of one byte.
    CHECK_LE(parity[i], UCHAR_MAX);
    bytes_[kRs255_223MessageBytes + pos_i] = parity[i];
  }
}

void EccMessage::FillWithRandomData(uint8_t *data, size_t len) {
  // Assumes that the PRNG has already been seeded.
  for (unsigned int i = 0; i < len; i++) {
    unsigned char tmp = rand() % 256;
    // std::cout << (unsigned int)tmp << " ";
    data[i] = tmp;
  }
  // std::cout << std::endl;
}

unsigned char *EccMessage::flatten() {
  memcpy(bytes_,
         first_message_,
         sizeof(first_message_));

  SetParity(first_parity_, FIRST);

  memcpy(bytes_ + kRs255_223TotalBytes,
         second_message_,
         sizeof(second_message_));

  SetParity(second_parity_, SECOND);

  return bytes_;
}

} // namespace cryptogram
