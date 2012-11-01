#include "array.h"

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

} // namespace cryptogram
