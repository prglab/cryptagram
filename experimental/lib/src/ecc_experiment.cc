// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#include <cstring>
#include <iostream>
#include <set>
#include <vector>

#include "aesthete.h"
#include "array.h"
#include "boost/numeric/ublas/io.hpp"
#include "discretizations.h"
#include "ecc_image.h"
#include "ecc_message.h"
#include "glog/logging.h"
#include "google/gflags.h"
#include "jpeg_codec.h"
#include "reentrant_rand.h"
#include "reed_solomon/rs_codec.h"

// Profiler headers.
/*
#include "gperftools/profiler.h"
#include "gperftools/heap-profiler.h"
*/

DEFINE_int32(quality, 95, "JPEG quality to use.");
DEFINE_int64(iters, 2, "Number of iterations to run.");

namespace cryptogram {

const int ByteSize = 8;

void PrintTwoByteInt(uint16_t num) {
  std::cout << std::endl;
  std::cout << "Printing Little Endian: '" << num << "'." << std::endl;
  for (int ii = 0; ii < 16; ii++) {
    int tmp = (num >> ii) & 1;
    std::cout << tmp;
  }
  std::cout << std::endl;
}

unsigned int CountErrors(const matrix<double>& matrix_a,
                         const matrix<double>& matrix_b,
                         int threshold) {
  CHECK_EQ(matrix_a.size1(), 4);
  CHECK_EQ(matrix_a.size2(), 4);
  CHECK_EQ(matrix_b.size1(), 4);
  CHECK_EQ(matrix_b.size2(), 4);

  matrix<unsigned char> diff = matrix_a - matrix_b;
  unsigned int nerrors = 0;
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      if (abs((int)(char)diff(i,j)) >= threshold) {
        nerrors++;
      }
    }
  }
  return nerrors;
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

  Discretizations set_discretizations;
  set_discretizations.insert(DiscreteValue(240));
  set_discretizations.insert(DiscreteValue(208));
  set_discretizations.insert(DiscreteValue(176));
  set_discretizations.insert(DiscreteValue(144));
  set_discretizations.insert(DiscreteValue(112));
  set_discretizations.insert(DiscreteValue(80));
  set_discretizations.insert(DiscreteValue(48));
  set_discretizations.insert(DiscreteValue(16));

  srand(time(NULL));

  array<matrix<unsigned char> *> decoded_blocks(kBlocksWide, kBlocksHigh);
  array<matrix<double> *> decoded_aes(kBlocksWide, kBlocksHigh);
  array<matrix<unsigned char> *> blocks(kBlocksWide, kBlocksHigh);
  array<matrix<double> *> aes_blocks(kBlocksWide, kBlocksHigh);

  for (int high = 0; high < kBlocksHigh; high++) {
    for (int wide = 0; wide < kBlocksWide; wide++) {
      decoded_blocks(wide, high) = new matrix<unsigned char>(8, 8);
      decoded_aes(wide, high) = new matrix<double>(4, 4);
      blocks(wide, high) = new matrix<unsigned char>(8, 8);
      aes_blocks(wide, high) = new matrix<double>(4, 4);
    }
  }
  array<unsigned char> image(kBlocksWide * kPixelDimPerBlock * kCharsPerPixel,
                             kBlocksHigh * kPixelDimPerBlock);

  for (int iteration = 0; iteration < FLAGS_iters; iteration++) {
  EccMessage ecc_msg;
  EccMessage::FillWithRandomData(ecc_msg.first_message(),
                                 kRs255_223MessageBytes);
  EccMessage::FillWithRandomData(ecc_msg.second_message(),
                                 kRs255_223MessageBytes);

  RsCodec rs_codec;
  rs_codec.Encode(ecc_msg.first_message(), ecc_msg.first_parity());
  rs_codec.Encode(ecc_msg.second_message(), ecc_msg.second_parity());

  // Now we have all of the values set for embedding into a JPEG.
  unsigned char *input_bytes = ecc_msg.flatten();

  const int kMatrixStrBytes = 6;
  for (int image_h = 0; image_h < kBlocksHigh; image_h++) {
    for (int image_w = 0; image_w < kBlocksWide; image_w++) {
      MatrixRepresentation mr;

      // TODO(tierney): Bottleneck here. Make this faster.
      mr.InitFromString(input_bytes +
                        (image_h * (kBlocksWide * kMatrixStrBytes)
                         + (kMatrixStrBytes * image_w)));

      std::vector<int> matrix_entries;
      mr.ToInts(&matrix_entries);

      image.FillBlockFromInts(
          matrix_entries, discretizations, image_h, image_w);
    }
  }

  // Prepare the matrices so that they are able to hold the values for the code.
  for (int high = 0; high < kBlocksHigh; high++) {
    for (int wide = 0; wide < kBlocksWide; wide++) {
      image.FillMatrixFromBlock(high, wide, blocks(wide, high));

      cryptogram::AverageAestheteBlocks(*blocks(wide, high),
                                        aes_blocks(wide, high));
    }
  }

  // array @image is prepared with the all of the JPEG color space information.
  vector<unsigned char> output_jpeg;
  assert(gfx::JPEGCodec::Encode(
      image.data,
      gfx::JPEGCodec::FORMAT_RGB,
      kBlocksWide * kPixelDimPerBlock,
      kBlocksHigh * kPixelDimPerBlock,
      kBlocksWide * kPixelDimPerBlock * kCharsPerPixel,
      FLAGS_quality,
      &output_jpeg));

  std::string output_bytes(output_jpeg.begin(), output_jpeg.end());
  // std::cerr << output_bytes << std::endl;

  vector<unsigned char> decoded;
  int width = 0, height = 0;
  assert(gfx::JPEGCodec::Decode(&output_jpeg[0],
                                output_jpeg.size(),
                                gfx::JPEGCodec::FORMAT_RGB,
                                &decoded,
                                &width, &height));

  for (int high = 0; high < kBlocksHigh; high++) {
    for (int wide = 0; wide < kBlocksWide; wide++) {
      // For each block, we want to be sure to capture the exact 64 pixel values
      // of that block.
      for (int i = 0; i < 8; i++) {
        for (int j = 0; j < 8; j++) {
          int idx = ((((high * kPixelDimPerBlock) + i) *
                      (kBlocksWide * kPixelDimPerBlock * 3))) +
              ((wide * 3 * kPixelDimPerBlock) + (3 * j));
          (*decoded_blocks(wide, high))(i, j) = decoded[idx];
        }
      }
      cryptogram::AverageAestheteBlocks(*decoded_blocks(wide, high),
                                        decoded_aes(wide, high));
    }
  }

  vector<unsigned char> full_message;
  for (int block_h = 0; block_h < kBlocksHigh; block_h++) {
    for (int block_w = 0; block_w < kBlocksWide; block_w++) {
      matrix<double> *decoded_mat = decoded_aes(block_w, block_h);
      vector<int> decoded_ints;
      for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
          double val = (*decoded_mat)(i,j);
          int idx = std::distance(
              set_discretizations.begin(),
              FindClosest(set_discretizations, DiscreteValue(val)));
          decoded_ints.push_back(idx);
        }
      }

      MatrixRepresentation mat_rep;
      mat_rep.InitFromInts(decoded_ints);
      std::string final(mat_rep.ToString());
      CHECK_EQ(final.size(), 6);

      for (unsigned int i = 0; i < final.size(); i++) {
        full_message.push_back(final[i]);
      }
    }
  }

  uint8_t data[223];
  uint16_t parity[32];
  for (int i = 0; i < 2; i++) {
    bzero(data, sizeof(data));
    bzero(parity, sizeof(parity));
    for (int j = i * 255; j < i * 255 + 223; j++) {
      data[j - (i * 255)] = full_message[j];
      // std::cout << (int)(unsigned char)full_message[j] << " ";
    }
    // std::cout << std::endl;
    for (int j = i * 255 + 223, ii = 0; j < i * 255 + 255; j++, ii++) {
      parity[ii] = full_message[j];
      // std::cout << (int)(unsigned char)full_message[j] << " ";
    }
    // std::cout << std::endl;
    
    int nerrors = rs_codec.Decode(data, parity);
    std::cout << "nerrors: " << nerrors << std::endl;
  }
  }
  for (int high = 0; high < kBlocksHigh; high++) {
    for (int wide = 0; wide < kBlocksWide; wide++) {
      delete decoded_blocks(wide, high);
      delete decoded_aes(wide, high);
      delete blocks(wide, high);
      delete aes_blocks(wide, high);
    }
  }

}
} // namespace cryptogram

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);
  google::ParseCommandLineFlags(&argc, &argv, false);
  /*
  ProfilerStart("ecc_experiment.prof");
  HeapProfilerStart("ecc_experiemnt.hprof");
  */
  cryptogram::Foo();
  /*
  HeapProfilerDump("lastreason");
  HeapProfilerStop();
  ProfilerStop();
  */

  return 0;
}
