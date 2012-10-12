#ifndef _JPEG_DELTA_H_
#define _JPEG_DELTA_H_

#include "basictypes.h"

namespace cryptogram {

// JPEGDelta enables comparing differences between sources of data that are
// supposed to represent JPEG images.
class JPEGDelta {
 public:
  // Returns the byte for byte diff between @image_a and @image_b.
  bool RGBDiff(const std::vector<unsigned char>& image_a,
               const std::vector<unsigned char>& image_b,
               std::vector<unsigned char>* diff_a_minus_b);

  // Converts the images to RGB byte arrays and then returns the return value of
  // RGBDiff().
  bool JPEGDiff(const unsigned char* image_a, const size_t image_a_size,
                const unsigned char* image_b, const size_t image_b_size,
                std::vector<unsigned char>* diff_a_minus_b);

 private:
  DISALLOW_IMPLICIT_CONSTRUCTORS(JPEGDelta);
};

} // namespace cryptogram

#endif  // _JPEG_DELTA_H_
