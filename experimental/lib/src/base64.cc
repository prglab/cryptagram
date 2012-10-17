// Copyright (c) 2006-2008 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "base64.h"

#include "glog/logging.h"
#include "modp_b64.h"

namespace base {

bool Base64Encode(const StringPiece& input, std::string* output) {
  std::string temp;
  temp.resize(modp_b64_encode_len(input.size()));  // makes room for null byte

  // null terminates result since result is base64 text!
  int input_size = static_cast<int>(input.size());
  int output_size= modp_b64_encode(&(temp[0]), input.data(), input_size);
  if (output_size < 0)
    return false;

  temp.resize(output_size);  // strips off null byte
  output->swap(temp);
  return true;
}

std::string Base64Encode(const StringPiece& input) {
  std::string temp;
  Base64Encode(input, &temp);
  return temp;
}

bool Base64Decode(const StringPiece& input, std::string* output) {
  std::string temp;
  temp.resize(modp_b64_decode_len(input.size()));

  // does not null terminate result since result is binary data!
  int input_size = static_cast<int>(input.size());
  int output_size = modp_b64_decode(&(temp[0]), input.data(), input_size);
  if (output_size < 0)
    return false;

  temp.resize(output_size);
  output->swap(temp);
  return true;
}

std::string Base64Decode(const StringPiece& input) {
  std::string temp;
  CHECK(Base64Decode(input, &temp));
  return temp;
}

}  // namespace base
