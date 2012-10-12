#include "jpeg_delta.h"


namespace cryptogram {

bool JPEGDelta::RGBDiff(const std::vector<unsigned char>& image_a,
                        const std::vector<unsigned char>& image_b,
                        std::vector<unsigned char>* diff_a_minus_b) {
  CHECK_NOTNULL(diff_a_minus_b);
  CHECK_EQ(image_a.size(), image_b.size()) << "Images should be the same size.";

  int output_length = image_a.size();

  // Clears the output vector and reserves the appropriate amount of space for the diff.
  diff_a_minus_b->clear();
  diff_a_minus_b->reserve(output_length);

  std::transform(image_a.begin(), image_a.end(),
                 image_b.begin(), image_b.end(),
                 std::back_inserter(*diff_a_minus_b),
                 std::minus<char>());
  return true;
}

} // namespace cryptogram
