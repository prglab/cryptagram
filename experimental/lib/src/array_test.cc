// Copyright 2012 The Cryptogram Authors. All Rights Reserved.
// Use of this source code is governed by a BSD-style license.

#include "gtest/gtest.h"

#include <set>
#include <string>
#include <vector>

#include "array.h"
#include "boost/scoped_ptr.hpp"
#include "discretizations.h"

using boost::scoped_ptr;
using std::vector;

namespace cryptogram {
namespace {

class ArrayTest : public ::testing::Test {
 protected:
  ArrayTest()
      : arr_from_vector_(new array<unsigned char>(8,8)),
        arr_from_set_(new array<unsigned char>(8,8)) {
  }

  virtual ~ArrayTest() {
    delete arr_from_vector_;
    delete arr_from_set_;
  }
        
  void SetUp() {
  }

  array<unsigned char> *arr_from_vector_;
  array<unsigned char> *arr_from_set_;
};

TEST_F(ArrayTest, TestThis) {
  EXPECT_EQ(0, 0);
}

TEST_F(ArrayTest, VectorSetParity) {
  vector<int> discretizations;
  discretizations.push_back(240);
  discretizations.push_back(208);
  discretizations.push_back(176);
  discretizations.push_back(144);
  discretizations.push_back(112);
  discretizations.push_back(80);
  discretizations.push_back(48);
  discretizations.push_back(16);

  Discretizations set_discretizations;
  set_discretizations.insert(DiscreteValue(240));
  set_discretizations.insert(DiscreteValue(208));
  set_discretizations.insert(DiscreteValue(176));
  set_discretizations.insert(DiscreteValue(144));
  set_discretizations.insert(DiscreteValue(112));
  set_discretizations.insert(DiscreteValue(80));
  set_discretizations.insert(DiscreteValue(48));
  set_discretizations.insert(DiscreteValue(16));

  vector<int> indices;
  indices.push_back(0);
  indices.push_back(1);
  indices.push_back(2);
  indices.push_back(3);
  indices.push_back(4);
  indices.push_back(5);
  indices.push_back(6);
  indices.push_back(7);
  indices.push_back(0);
  indices.push_back(1);
  indices.push_back(2);
  indices.push_back(3);
  indices.push_back(4);
  indices.push_back(5);
  indices.push_back(6);
  indices.push_back(7);
  
  // arr_from_vector_->FillBlockFromInts(indices, discretizations, 0, 0);
  arr_from_set_->FillBlockFromInts(indices, set_discretizations, 0, 0);
  // for (int i = 0; i < 8; i++) {
  //   for (int j = 0; j < 8; j++) {
  //     //EXPECT_EQ((*arr_from_vector_)(j, i), (*arr_from_set_)(j, i));
  //     (*arr_from_vector_)(j, i) ==  (*arr_from_set_)(j, i);
  //   }
  // }
}

} // namespace
} // namespace cryptogram

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
  
