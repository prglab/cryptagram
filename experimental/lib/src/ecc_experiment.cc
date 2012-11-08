// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <iostream>
#include <vector>

#include "aesthete.h"
#include "array.h"
#include "ecc_image.h"
#include "google/gflags.h"
#include "jpeg_codec.h"
#include "reentrant_rand.h"
#include "reed_solomon/rs_codec.h"

DEFINE_int32(quality, 72, "JPEG quality to use.");

namespace cryptogram {

const int ByteSize = 8;

void FillWithRandomData(uint8_t *data, size_t len) {
  ReentrantRNG prng;
  for (unsigned int i = 0; i < len; i++) {
    data[i] = prng.RandChar();
  }
}

void Foo() {
  std::vector<int> discretizations;
  discretizations.push_back(240);
  discretizations.push_back(208);
  discretizations.push_back(176);
  discretizations.push_back(144);
  discretizations.push_back(112);
  discretizations.push_back(80);
  discretizations.push_back(48);
  discretizations.push_back(16);

  array<unsigned char> image(kBlocksWide * kPixelDimPerBlock * kCharsPerPixel,
                             kBlocksHigh * kPixelDimPerBlock);

  ReentrantRNG prng;
  char ecc_bytes[510];
  for (int i = 0; i < 510; i++) {
    ecc_bytes[i] = prng.RandChar();
  }

  uint8_t data[kRs255_223MessageBytes];
  FillWithRandomData(data, kRs255_223MessageBytes);

  RsCodec rs_codec;
  uint16_t parity[kRs255_223ParityBytes];
  rs_codec.Encode(data, parity);
  memcpy(ecc_bytes,
         data,
         kRs255_223MessageBytes);
  memcpy(ecc_bytes + kRs255_223MessageBytes,
         parity,
         kRs255_223ParityBytes);

  memcpy(ecc_bytes + kRs255_223TotalBytes,
         data,
         kRs255_223MessageBytes);
  memcpy(ecc_bytes + kRs255_223TotalBytes + kRs255_223MessageBytes,
         parity,
         kRs255_223ParityBytes);
  
  for (int i = 0; i < 255; i++) {
    std::cout << (int)ecc_bytes[i] << " ";
  }
  std::cout << std::endl;

  for (int i = 255; i < 510; i++) {
    std::cout << (int)ecc_bytes[i] << " ";
  }
  std::cout << std::endl;
  
  // Now we have all of the values set for embedding into a JPEG.
  for (int image_h = 0; image_h < kBlocksHigh; image_h++) {
    for (int image_w = 0; image_w < kBlocksWide; image_w++) {
      MatrixRepresentation mr;
      mr.InitFromString(ecc_bytes + (image_h * kBlocksWide + image_w));

      std::vector<int> matrix_entries;
      mr.ToInts(&matrix_entries);

      image.FillBlockFromInts(matrix_entries, discretizations, image_h, image_w);
    }
  }

  vector<unsigned char> output_jpeg;
  assert(gfx::JPEGCodec::Encode(image.data,
                                gfx::JPEGCodec::FORMAT_RGB,
                                kBlocksWide * kPixelDimPerBlock,
                                kBlocksHigh * kPixelDimPerBlock,
                                kBlocksWide * kPixelDimPerBlock * kCharsPerPixel,
                                FLAGS_quality,
                                &output_jpeg));

  std::string output(output_jpeg.begin(), output_jpeg.end());
  std::cout << output << std::endl;

  // for (int height = 0; height < kBlocksHigh * kPixelDimPerBlock; height++) {
  //   for (int width = 0;
  //        width < kBlocksWide * kPixelDimPerBlock * kCharsPerPixel;
  //        width += kCharsPerPixel) {
      
  //     std::cout <<
  //         (int)image.data[
  //             height * kBlocksWide * kPixelDimPerBlock * kCharsPerPixel +
  //             width] << " ";
  //   }
  //   std::cout << std::endl;
  // }
}

} // namespace cryptogram

int main(int argc, char** argv) {
  google::ParseCommandLineFlags(&argc, &argv, false);    
  cryptogram::Foo();

  return 0;
}
