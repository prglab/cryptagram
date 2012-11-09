#include "array.h"

#include <cstdlib>

namespace cryptogram {

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

// Takes a vector of 16 ints in @values and uses those as the entries to data
// for the aesthete matrix. Very cryptogram-specific function.
template<>
void array<unsigned char>::FillFromInts(const std::vector<int>& indices,
                                        const std::vector<int>& values) {
  CHECK_EQ(indices.size(), 16);
  CHECK_EQ(values.size(), 8);
  for (int i = 0; i < 8; i += 2) {
    for (int j = 0; j < 8; j += 2) {
      const int value_index = indices[(i / 2) * 4 + (j / 2)];
      const int value = values[value_index];

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

template<>
void array<unsigned char>::FillBlockFromInts(
    const std::vector<int>& indices,
    const std::vector<int>& values,
    int block_h,
    int block_w) {
  CHECK_EQ(indices.size(), 16);
  CHECK_EQ(values.size(), 8);

  const int init_h = block_h * 8;
  const int init_w = block_w * 8;

  for (int hi = init_h, i = 0; hi < init_h + 8; hi += 2, i++) {
    for (int wi = init_w, j = 0; wi < init_w + 8; wi += 2, j++) {
      const int value_index = indices[i * 4 + j];
      const int value = values[value_index];

      data[(hi * w + (3 * wi))] = value;
      data[(hi * w + (3 * wi)) + 1] = value;
      data[(hi * w + (3 * wi)) + 2] = value;
      data[(hi * w + (3 * wi)) + 3] = value;
      data[(hi * w + (3 * wi)) + 4] = value;
      data[(hi * w + (3 * wi)) + 5] = value;

      data[((hi + 1) * w + (3 * wi))] = value;
      data[((hi + 1) * w + (3 * wi)) + 1] = value;
      data[((hi + 1) * w + (3 * wi)) + 2] = value;
      data[((hi + 1) * w + (3 * wi)) + 3] = value;
      data[((hi + 1) * w + (3 * wi)) + 4] = value;
      data[((hi + 1) * w + (3 * wi)) + 5] = value;
    }
  }
}

template<>
void array<unsigned char>::FillMatrixFromBlock(
    int block_h,
    int block_w,
    matrix<unsigned char>* lum_matrix) {
  CHECK_NOTNULL(lum_matrix);
  CHECK_EQ(lum_matrix->size1(), 8);
  CHECK_EQ(lum_matrix->size2(), 8);
  
  const int init_h = block_h * 8;
  const int init_w = block_w * 8;

  for (int i = 0; i < kPixelDimPerBlock; i++) {
    for (int j = 0; j < kPixelDimPerBlock; j++) {
      (*lum_matrix)(i,j) =
          data[(init_h + i) * (kBlocksWide * kPixelDimPerBlock * 3) +
               (init_w + 3 * j)];
    }
  }
}
   
    

} // namespace cryptogram
