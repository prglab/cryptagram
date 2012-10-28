// Copyright 2012 The Cryptogram Authors. BSD-Style License.

#ifndef _CRYPTOGRAM_CODEC_H_
#define _CRYPTOGRAM_CODEC_H_

namespace cryptogram {

class Codec {
 public:
  static bool Encode();

  static bool Decode();

 private:
  DISALLOW_IMPLICIT_CONSTRUCTORS(Codec);
  
};

} // namespace cryptogram

#endif  // _CRYPTOGRAM_CODEC_H_
