// Copyright 2012 NYU. All Rights Reserved.
// Use of this source code is governed by a BSD-style license.

#include "google/logging.h"

namespace prg {
namespace cryptogram {

class Codec {
 public:
  bool Encode();

  bool Decode();

 private:
  DISALLOW_EVIL_CONSTRUCTORS(Codec);
};

} // namespace cryptogram
} // namespace prg
