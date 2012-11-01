/*
 * experiment.cc
 *
 *  Created on: Sep 18, 2012
 *      Author: tierney
 */

#include "experiment.h"

#include "aesthete.h"
#include "array.h"
#include "boost/numeric/ublas/io.hpp"
#include "boost/numeric/ublas/matrix.hpp"
#include "glog/logging.h"
#include "google/gflags.h"
#include "jpeg_codec.h"

DEFINE_int32(quality, 95, "JPEG Quality level to use.");

using boost::numeric::ublas::matrix;

namespace cryptogram {

Experiment::Experiment(const std::vector<int>& discretizations)
    : discretizations_(discretizations) {
}

int Experiment::Run(const std::vector<int>& matrix_entries,
                    std::ofstream* out_fstream) {
  CHECK_EQ(matrix_entries.size(), 16);
  
  array<unsigned char> image(8 * 3, 8);

  // Uses the matrix_entries, which are simply indices into the
  // values/discretizations_ that can be embedded. Sets the corresponding entry
  // of the matrix with the index of discretizations_'s value.
  image.FillFromInts(matrix_entries, discretizations_);

  // Begin Experiment.
  matrix<unsigned char> orig_matrix(8, 8);
  for (int i = 0; i < 8; i++) {
    for (int j = 0; j < 24; j += 3) {
      orig_matrix(i, j/3) = image(j,i);
    }
  }
  matrix<double> orig_aes(4, 4);
  cryptogram::AverageAestheteBlocks(orig_matrix, &orig_aes);

  std::vector<unsigned char> output;
  gfx::JPEGCodec::Encode(image.data,
                         gfx::JPEGCodec::FORMAT_RGB,
                         8, 8, 24,
                         FLAGS_quality,
                         &output);
  int w = 0, h = 0;
  std::vector<unsigned char> decoded;
  gfx::JPEGCodec::Decode(&output[0], output.size(),
                         gfx::JPEGCodec::FORMAT_RGB,
                         &decoded,
                         &w, &h);

  matrix<unsigned char> decoded_matrix(8, 8);
  for (int i = 0; i < 8; i++) {
    for (int j = 0; j < 8; j++) {
      decoded_matrix(i,j) = decoded[i * 24 + 3 * j];
    }
  }

  matrix<double> decoded_aes(4, 4);
  cryptogram::AverageAestheteBlocks(decoded_matrix, &decoded_aes);
  // f_stream << "orig: " << orig_aes << std::endl;
  // f_stream << "deco: " << decoded_aes << std::endl;
  matrix<unsigned char> diff = orig_aes - decoded_aes;
  unsigned int nerrors = 0;
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      if (abs((int)(char)diff(i,j)) >= 16) {
        nerrors++;
      }
    }
  }
  if (nerrors > 0) {
    *out_fstream << nerrors << " / " << orig_aes << std::endl;
  }
	return nerrors;
}

} // namespace cryptogram
