#include <iostream>
#include <vector>

#include "aesthete.h"
#include "array.h"
#include "ecc_image.h"

namespace cryptogram {

void Foo() {
  array<unsigned char> image(kBlocksWide * kPixelDimPerBlock * kCharsPerPixel,
                             kBlocksHigh * kPixelDimPerBlock);
  // How to embed a sequence of bits into the array?

  char data[6];
  memset(data, 1, 6);
  
  MatrixRepresentation mr;
  mr.InitFromString(data);
  std::vector<int> matrix_entries;
  mr.ToInts(&matrix_entries);

  std::vector<int> discretizations;
  discretizations.push_back(240);
  discretizations.push_back(208);
  discretizations.push_back(176);
  discretizations.push_back(144);
  discretizations.push_back(112);
  discretizations.push_back(80);
  discretizations.push_back(48);
  discretizations.push_back(16);

  std::cout << image.h << " " << image.w << std::endl;
  image.FillBlockFromInts(matrix_entries, discretizations, 2, 14);
  for (int height = 0; height < kBlocksHigh * kPixelDimPerBlock; height++) {
    for (int width = 0;
         width < kBlocksWide * kPixelDimPerBlock * kCharsPerPixel;
         width += kCharsPerPixel) {
      std::cout <<
          (int)image.data[height * kBlocksWide * kPixelDimPerBlock * kCharsPerPixel +
                     width] << " ";
    }
    std::cout << std::endl;
  }
}

} // namespace cryptogram

int main(int argc, char** argv) {
  cryptogram::Foo();
  
  return 0;
}
