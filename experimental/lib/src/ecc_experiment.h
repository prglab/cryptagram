// Copyright 2012. The Cryptogram Authors. BSD License.
// Author: tierney@cs.nyu.edu (Matt Tierney)

#ifndef _ECC_EXPERIMENT_H_
#define _ECC_EXPERIMENT_H_

#include <fstream>
#include <string>
#include <vector>

#include "array.h"
#include "aesthete.h"
#include "discretizations.h"
#include "ecc_image.h"
#include "ecc_message.h"
#include "jpeg_codec.h"
#include "google/gflags.h"

#include "base/stack_container.h"

DECLARE_int32(quality);

using std::string;
using std::vector;

namespace cryptogram {

class EccExperiment {
 public:
  explicit EccExperiment(const string& filename);
  virtual ~EccExperiment();

  void Run();
      
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

  StackVector<int, 8> discretizations_;
  Discretizations set_discretizations_;

  vector<unsigned char> output_jpeg;
  vector<unsigned char> full_message;
  vector<int> decoded_ints;
  vector<unsigned char> decoded;

  int width;
  int height;

  std::ofstream f_stream_;
};


} // namespace cryptogram

#endif  // _ECC_EXPERIMENT_H_
