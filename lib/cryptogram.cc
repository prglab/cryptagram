// Copyright 2012 NYU. All Rights Reserved.
// Use of this source code is governed by a BSD-style license.
// For more information about cryptogram, please visit
// http://cryptogram.prglab.org.

#include "cryptogram.h"

namespace prg {

Cryptogram::Cryptogram(const Codec& codec)
    : codec_(codec) {
}

Cryptogram::~Cryptogram() {
}

bool Cryptogram::Encrypt(const std::string& filename) {
  // Open @filename.

  // Read the bytes.

  // Start encrypting those bytes.
  return true;
}

} // namespace prg
