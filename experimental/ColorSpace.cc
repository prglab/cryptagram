
#include "ColorSpace.h"

namespace cryptogram {

ColorSpace::RGB::RGB(int red, int green, int blue)
    : red(red), green(green), blue(blue) {
}

ColorSpace::ColorSpace() {
}

ColorSpace::~ColorSpace() {
}

bool ColorSpace::GenerateObservations(
    std::vector<ColorSpace::YCC>* observations) {
  if (!observations || !observations->empty()) {
    return false;
  }

  // Reserve dimensionality of valid input colorspace.
  observations->reserve(256 * 256 * 256);

  for (int red = 0; red < 256; red++)
    for (int green = 0; green < 256; green++)
      for (int blue = 0; blue < 256; blue++) {
        ColorSpace::RGB rgb(red, green, blue);
        ColorSpace::YCC ycc;
        if (!RgbToYcc(rgb, &ycc)) {
          continue;
        }
        observations->push_back(ycc);
      }
  return true;
}

bool ColorSpace::RgbToYcc(const ColorSpace::RGB& rgb, ColorSpace::YCC* ycc) {
  if (ycc == NULL) {
    return false;
  }

  ycc->lum = 0.299 * rgb.red + 0.587 * rgb.green + 0.114 * rgb.blue;
  ycc->cb = 128 - 0.168736 * rgb.red - 0.331264 * rgb.green + 0.5 * rgb.blue;
  ycc->cr = 128 + 0.5 * rgb.red - 0.418688 * rgb.green - 0.081312 * rgb.blue;
  return true;
}

}	// namespace cryptogram
