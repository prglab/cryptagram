// Copyright 2012 NYU. All Rights Reserved.
// Use of this source code is governed by a BSD-style license.

namespace prg {
class ImageInterface {
 public:
  enum Orientation {
    UP = 0,
    DOWN,
    LEFT,
    RIGHT,
  };

  virtual ~ImageInterface() {}

  float width();
  float height();
  Orientation orientation();

};
} // namespace prg
