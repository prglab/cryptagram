#include "jpeg_delta.h"

#include <algorithm>

#include "jpeg_codec.h"
#include "glog/logging.h"

namespace cryptogram {

bool JPEGDelta::RGBDiff(const std::vector<unsigned char>& image_a,
                        const std::vector<unsigned char>& image_b,
                        std::vector<unsigned char>* diff_a_minus_b) {
  CHECK_NOTNULL(diff_a_minus_b);
  CHECK_EQ(image_a.size(), image_b.size()) << "Images should be the same size.";

  int output_length = image_a.size();

  // Clears the output vector and reserves the appropriate amount of space for
  // the diff.
  diff_a_minus_b->clear();
  diff_a_minus_b->reserve(output_length);

  // Character for character subtraction of image_b values from image_a
  // values. Results are stored in @diff_a_minus_b.
  std::transform(image_a.begin(), image_a.end(),
                 image_b.begin(),
                 std::back_inserter(*diff_a_minus_b),
                 std::minus<char>());
  return true;
}

bool JPEGDelta::JPEGDiff(
    const unsigned char* image_a, const size_t image_a_size,
    const unsigned char* image_b, const size_t image_b_size,
    std::vector<unsigned char>* diff_a_minus_b) {
  CHECK_NOTNULL(diff_a_minus_b);

  std::vector<unsigned char> rgb_image_a;
  int w_a = 0, h_a = 0;
  CHECK(gfx::JPEGCodec::Decode(image_a, image_a_size, gfx::JPEGCodec::FORMAT_RGB,
                               &rgb_image_a, &w_a, &h_a));

  std::vector<unsigned char> rgb_image_b;
  int w_b = 0, h_b = 0;
  CHECK(gfx::JPEGCodec::Decode(image_b, image_b_size, gfx::JPEGCodec::FORMAT_RGB,
                               &rgb_image_b, &w_b, &h_b));

  return JPEGDelta::RGBDiff(rgb_image_a, rgb_image_b, diff_a_minus_b);
}

} // namespace cryptogram
