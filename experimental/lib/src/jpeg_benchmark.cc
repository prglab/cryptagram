#include <iostream>
#include <vector>

#include "boost/scoped_array.hpp"
#include "glog/logging.h"
#include "jpeg_codec.h"


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

class RGB {
 public:
  RGB(unsigned char red, unsigned char green, unsigned char blue) {
    pixels_.reset(new unsigned char[3]);
    pixels_[0] = red;
    pixels_[1] = green;
    pixels_[2] = blue;
  }

  unsigned char* values() const {
    return pixels_.get();
  }

  void operator=(const RGB& rgb) {
    pixels_.reset(new unsigned char[3]);
    pixels_[0] = rgb.values()[0];
    pixels_[1] = rgb.values()[1];
    pixels_[2] = rgb.values()[2];
  }
  
 private:
  RGB();
  boost::scoped_array<unsigned char> pixels_;
};

template<>
void array<unsigned char>::RandomAesthete(const std::vector<int>& values) {
  for (int i = 0; i < h; i += 2) {
    for (int j = 0; j < w; j += 2) {
      int value = values[rand() % values.size()];
      this->data[i * w + (3 * j)] = value;
      this->data[i * w + (3 * j) + 1] = value;
      this->data[i * w + (3 * j) + 2] = value;

      this->data[(i + 1) * w + (3 * j)] = value;
      this->data[(i + 1) * w + (3 * j) + 1] = value;
      this->data[(i + 1) * w + (3 * j) + 2] = value;
            
      this->data[i * w + ((3 * j))] = value;
      this->data[i * w + ((3 * j) + 1)] = value;
      this->data[i * w + ((3 * j) + 2)] = value;
      
      this->data[(i + 1) * w + ((3 * j))] = value;
      this->data[(i + 1) * w + ((3 * j) + 1)] = value;
      this->data[(i + 1) * w + ((3 * j) + 2)] = value;
    }
  }
}

} // namespace cryptogram

int main(int argc, char** argv) {
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
  
  cryptogram::array<unsigned char> image(8 * 3, 8);
  image.RandomAesthete(values);
  for (int i = 0; i < 8; i++) {
    for (int j = 0; j < 24; j++) {
      printf("%3d ", image(j,i));
    }
    std::cout << std::endl;    
  }
  std::cout << std::endl;
  
  std::vector<unsigned char> output;
  gfx::JPEGCodec::Encode(image.data,
                         gfx::JPEGCodec::FORMAT_RGB,
                         8, 8, 24,
                         95,
                         &output);
  int w = 0, h = 0;
  std::vector<unsigned char> decoded;
  gfx::JPEGCodec::Decode(&output[0], output.size(),
                         gfx::JPEGCodec::FORMAT_RGB,
                         &decoded,
                         &w, &h);

  for (int i = 0; i < w; i++) {
    for (int j = 0; j < h; j++) {
      printf("%3d ", decoded[j * 8 + i]);
    }
    std::cout << std::endl;
  }
  
  return 0;
}
