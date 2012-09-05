// Copyright 2012 NYU. All Rights Reserved.
// Use of this source code is governed by a BSD-style license.

#include "gtest/gtest.h"
#include "cryptogram.h"

namespace prg {
namespace {

class FooTest : public ::testing::Test {
 protected:
  FooTest() : string_("hello, world") {
  }

  std::string string_;
};

TEST_F(FooTest, TestThis) {
  EXPECT_EQ(0, 0);
}

} // namespace
} // namespace prg

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
