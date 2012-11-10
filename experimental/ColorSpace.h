#ifndef _CRYPTOGRAM_COLORSPACE_H_
#define _CRYPTOGRAM_COLORSPACE_H_

#include <cstdlib>
#include <vector>

namespace cryptogram {

class ColorSpace {
 public:
  struct RGB {
    RGB(int red, int green, int blue);
    int red;
    int green;
    int blue;
  };

  struct YCC {
    float lum;
    float cb;
    float cr;
  };

  ColorSpace();
  virtual ~ColorSpace();

  bool GenerateObservations(std::vector<YCC>* observations);

 private:
  bool IsValidColor(float value);
  bool RgbToYcc(const RGB& rgb, YCC* ycc);

};

} // namespace cryptogram

#endif  // _CRYPTOGRAM_COLORSPACE_H_
