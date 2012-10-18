#include <iostream>
#include <time.h>
#include <vector>

#include "boost/numeric/ublas/io.hpp"
#include "boost/numeric/ublas/matrix.hpp"
#include "boost/scoped_array.hpp"
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

template<typename T>
struct array {
  T* data;
  int w, h;

  array() : data(NULL), w(0), h(0) {}

  array(int width, int height) {
    data = new T[width * height];
    w = width;
    h = height;
  }

  ~array() {
    delete[] data;
  }

  T& operator()(int x, int y) {
    return data[y * w + x];
  }

  void RandomAesthete(const std::vector<int>& values);
};

template<>
void array<unsigned char>::RandomAesthete(const std::vector<int>& values) {
  for (int i = 0; i < 8; i += 2) {
    for (int j = 0; j < 8; j += 2) {
      int value = values[rand() % values.size()];

      data[(i * w + (3 * j))] = value;
      data[(i * w + (3 * j)) + 1] = value;
      data[(i * w + (3 * j)) + 2] = value;
      data[(i * w + (3 * j)) + 3] = value;
      data[(i * w + (3 * j)) + 4] = value;
      data[(i * w + (3 * j)) + 5] = value;

      data[((i + 1) * w + (3 * j))] = value;
      data[((i + 1) * w + (3 * j)) + 1] = value;
      data[((i + 1) * w + (3 * j)) + 2] = value;
      data[((i + 1) * w + (3 * j)) + 3] = value;
      data[((i + 1) * w + (3 * j)) + 4] = value;
      data[((i + 1) * w + (3 * j)) + 5] = value;
    }
  }
}

void AverageAestheteBlocks(const matrix<unsigned char>& input,
              matrix<double>* output) {
  CHECK_NOTNULL(output);
  for (int i = 0; i < 8; i += 2) {
    for (int j = 0; j < 8; j += 2) {
      float temp = (input(i,j) + input(i+1,j) + input(i,j+1) +
                    input(i+1,j+1)) / 4.;
      (*output)(i/2,j/2) = temp;
    }
  }
}

class Experiment {
 public:
  void Start() {
    thread_ = boost::thread(&
  }


 private:
  boost::thread thread_;
};

} // namespace cryptogram


int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);
  google::ParseCommandLineFlags(&argc, &argv, false);

  srand(time(NULL));
  // Generate images.
  std::vector<int> values;
  values.push_back(238);
  values.push_back(210);
  values.push_back(182);
  values.push_back(154);
  values.push_back(126);
  values.push_back(98);
  values.push_back(70);
  values.push_back(42);
  values.push_back(14);

  for (int iter = 0; iter < FLAGS_iters; iter++) {
    cryptogram::array<unsigned char> image(8 * 3, 8);
    image.RandomAesthete(values);

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
        if (abs((int)(char)diff(i,j)) > 14) {
          nerrors++;
        }
      }
    }
    if (nerrors > 0) {
      std::cout << nerrors << std::endl;
    }
  }

  return 0;
}