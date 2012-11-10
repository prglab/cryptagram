// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include "ecc_experiment.h"

namespace cryptogram {

EccExperiment::EccExperiment(const string& filename)
    : output_filename_(filename),
      decoded_blocks(kBlocksWide, kBlocksHigh),
      decoded_aes(kBlocksWide, kBlocksHigh),
      blocks(kBlocksWide, kBlocksHigh),
      aes_blocks(kBlocksWide, kBlocksHigh),
      image(kBlocksWide * kPixelDimPerBlock * kCharsPerPixel,
            kBlocksHigh * kPixelDimPerBlock) {
    
  // Initialize all of the pointers in our containers.
  for (int high = 0; high < kBlocksHigh; high++) {
    for (int wide = 0; wide < kBlocksWide; wide++) {
      decoded_blocks(wide, high) = new matrix<unsigned char>(8, 8);
      decoded_aes(wide, high) = new matrix<double>(4, 4);
      blocks(wide, high) = new matrix<unsigned char>(8, 8);
      aes_blocks(wide, high) = new matrix<double>(4, 4);
    }
  }

  discretizations_->push_back(240);
  discretizations_->push_back(208);
  discretizations_->push_back(176);
  discretizations_->push_back(144);
  discretizations_->push_back(112);
  discretizations_->push_back(80);
  discretizations_->push_back(48);
  discretizations_->push_back(16);

  set_discretizations_.insert(DiscreteValue(240));
  set_discretizations_.insert(DiscreteValue(208));
  set_discretizations_.insert(DiscreteValue(176));
  set_discretizations_.insert(DiscreteValue(144));
  set_discretizations_.insert(DiscreteValue(112));
  set_discretizations_.insert(DiscreteValue(80));
  set_discretizations_.insert(DiscreteValue(48));
  set_discretizations_.insert(DiscreteValue(16));

  f_stream_.open(output_filename_.c_str(), std::ofstream::binary);
}

EccExperiment::~EccExperiment() {
  for (int high = 0; high < kBlocksHigh; high++) {
    for (int wide = 0; wide < kBlocksWide; wide++) {
      delete decoded_blocks(wide, high);
      delete decoded_aes(wide, high);
      delete blocks(wide, high);
      delete aes_blocks(wide, high);
    }
  }
  f_stream_.close();
}


} // namespace cryptogram
