// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#ifndef _ECC_EXPERIMENT_H_
#define _ECC_EXPERIMENT_H_

#include <string>
#include <vector>

#include "discretizations.h"
#include "ecc_image.h"
#include "ecc_message.h"
#include "jpeg_codec.h"
#include "google/gflags.h"

DECLARE_int32(quality);

using std::string;
using std::vector;

namespace cryptogram {

class EccExperiment {
 public:
  explicit EccExperiment(const string& filename) :
      output_filename_(filename),
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

    discretizations_.push_back(240);
    discretizations_.push_back(208);
    discretizations_.push_back(176);
    discretizations_.push_back(144);
    discretizations_.push_back(112);
    discretizations_.push_back(80);
    discretizations_.push_back(48);
    discretizations_.push_back(16);

    set_discretizations_.insert(DiscreteValue(240));
    set_discretizations_.insert(DiscreteValue(208));
    set_discretizations_.insert(DiscreteValue(176));
    set_discretizations_.insert(DiscreteValue(144));
    set_discretizations_.insert(DiscreteValue(112));
    set_discretizations_.insert(DiscreteValue(80));
    set_discretizations_.insert(DiscreteValue(48));
    set_discretizations_.insert(DiscreteValue(16));
  }

  virtual ~EccExperiment() {
    for (int high = 0; high < kBlocksHigh; high++) {
      for (int wide = 0; wide < kBlocksWide; wide++) {
        delete decoded_blocks(wide, high);
        delete decoded_aes(wide, high);
        delete blocks(wide, high);
        delete aes_blocks(wide, high);
      }
    }
  }

  void Run(int *first_nerrors, int *second_nerrors) {
    CHECK_NOTNULL(first_nerrors);
    CHECK_NOTNULL(second_nerrors);
    
    ecc_msg_.InitWithRandomData();

    rs_codec_.Encode(ecc_msg_.first_message(), ecc_msg_.first_parity());
    rs_codec_.Encode(ecc_msg_.second_message(), ecc_msg_.second_parity());

    unsigned char *input_bytes = ecc_msg_.flatten();

    // Fill the blocks of the image.
    for (int image_h = 0; image_h < kBlocksHigh; image_h++) {
      for (int image_w = 0; image_w < kBlocksWide; image_w++) {

        // TODO(tierney): Bottleneck here. Make this faster.
        matrix_rep_.InitFromString(input_bytes +
                                   (image_h * (kBlocksWide * kMatrixStrBytes)
                                    + (kMatrixStrBytes * image_w)));
        matrix_rep_.ToInts(&matrix_entries_);

        image.FillBlockFromInts(
            matrix_entries_, discretizations_, image_h, image_w);
      }
    }

    // Compute the aesthete block values.
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
                set_discretizations_.begin(),
                FindClosest(set_discretizations_, DiscreteValue(val)));
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
    
      (i == 0 ? *first_nerrors : *second_nerrors) =
          rs_codec_.Decode(data, parity);
    }
  }
      
 private:
  string output_filename_;
  
  EccMessage ecc_msg_;
  RsCodec rs_codec_;
  MatrixRepresentation matrix_rep_;
  vector<int> matrix_entries_;

  array<matrix<unsigned char> *> decoded_blocks;
  array<matrix<double> *> decoded_aes;
  array<matrix<unsigned char> *> blocks;
  array<matrix<double> *> aes_blocks;

  array<unsigned char> image;

  vector<int> discretizations_;
  Discretizations set_discretizations_;
};


} // namespace cryptogram

#endif  // _ECC_EXPERIMENT_H_
