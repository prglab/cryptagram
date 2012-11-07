// Copyright 2012. The Cryptogram Authors. BSD-Style License.
// JPEG Benchmark C++ Code.
// 
// Should have multiple threads handling different efforts. In
// particular we want to have three types of threads. One takes care
// of paging in from disk already-generated matrices (six bytes per
// matrix representations on disk). These are then encapsulated in a
// queue of batches of the matrices. These batches are then what will
// be passed to worker threads. The worker threads will have access to
// these values in memory and claim locks on the queues. The queues
// then will be used for coordinating the work of the rest of the

#include <iostream>
#include <time.h>
#include <vector>

#include "aesthete.h"
#include "array.h"
#include "boost/numeric/ublas/io.hpp"
#include "boost/numeric/ublas/matrix.hpp"
#include "boost/scoped_array.hpp"
#include "boost/thread.hpp"
#include "google/gflags.h"
#include "glog/logging.h"
#include "jpeg_codec.h"

DEFINE_string(matrices, "matrices.log",
              "Where to read/write matrices used. NOT IMPLEMENTED.");
DEFINE_int32(quality, 95, "JPEG Quality level to use.");
DEFINE_int64(iters, 1000, "Number of iterations.");

using boost::numeric::ublas::matrix;

namespace cryptogram {

// Generates the random values to fill @entries based on random choices of the
// values in @values.
void GenerateRandomRgbArray(
    const int* values,
    const int num_values,
    const int num_rgb_pixels,
    unsigned char* entries) {
  CHECK_NOTNULL(entries);
  CHECK_NOTNULL(values);

  for (int i = 0; i < num_rgb_pixels; i++) {
    size_t val_index = rand() % num_values;
    int value = values[val_index];
    entries[(3 * i)] = value;
    entries[(3 * i) + 1] = value;
    entries[(3 * i) + 2] = value;
  }
}


class Experiment {
 public:
  Experiment(int i) : i_(i) {}

  virtual ~Experiment() {}

  void Start() {
    thread_ = boost::thread(&Experiment::Run, this);
  }

  void Wait() {
    thread_.join();
  }

  void Run() {
    printf("Work %d\n", i_);
  }

 private:
  int i_;
  boost::thread thread_;
};

} // namespace cryptogram


int main(int argc, char** argv) {
  // std::vector<cryptogram::Experiment*> exps;
  // for (int i = 0; i < 10; i++) {
  //   exps.push_back(new cryptogram::Experiment(i));
  // }
  // for (int i = 0; i < 10; i++) {
  //   exps[i]->Start();
  // }
  // for (int i = 0; i < 10; i++) {
  //   exps[i]->Wait();
  // }
  // return 0;

  google::InitGoogleLogging(argv[0]);
  google::ParseCommandLineFlags(&argc, &argv, false);

  srand(time(NULL));
  // Generate images.
  std::vector<int> values;
  values.push_back(240);
  values.push_back(208);
  values.push_back(176);
  values.push_back(144);
  values.push_back(112);
  values.push_back(80);
  values.push_back(48);
  values.push_back(16);

  for (int iter = 0; iter < FLAGS_iters; iter++) {
    cryptogram::array<unsigned char> image(8 * 3, 8);
    image.RandomAesthete(values);

    // TODO(tierney): Convert the particular vector<int> into the matrix.
    
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

    matrix<unsigned char> diff = orig_aes - decoded_aes;
    unsigned int nerrors = 0;
    for (int i = 0; i < 4; i++) {
      for (int j = 0; j < 4; j++) {
        if (abs((int)(char)diff(i,j)) > 16) {
          nerrors++;
        }
      }
    }
    if (nerrors > 0) {
      std::cout << nerrors << " / " << orig_aes << std::endl;
    }
  }

  return 0;
}
