// Copyright 2012 NYU. All Rights Reserved.
// Use of this source code is governed by a BSD-style license.

#include <string>

namespace prg {

class Cryptogram {
 public:
  struct Codec {
  };

  explicit Cryptogram(const Codec& codec);
  virtual ~Cryptogram();

  bool Encrypt(const std::string& filename);

 private:
  Codec codec_;
};

} // namespace prg
