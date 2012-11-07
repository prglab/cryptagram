#ifndef _ECC_IMAGE_H_
#define _ECC_IMAGE_H_

namespace cryptogram {

// Given the sequence of input bits, we apply ECC, so 223 bytes becomes 255
// bytes. These 255 bytes are then embedded in 85 48-bit blocks.  We are given a
// sequence of 446 pseudo-random bytes. These are then split into two blocks
// which are each ECC'd to produce two sequences of 255 bytes. We then embed the
// 255 bytes.

// How to turn the 510 bytes into a (5*8) x (17*8) JPEG image?
// 5440 pixels * 3 for unsigned chars.
// array(17 blocks wide * 8 pixels / block * 3 chars / pixel,
//       5 blocks high * 8 pixels / block)

const int kBlocksWide = 17;
const int kBlocksHigh = 5;
const int kPixelDimPerBlock = 8;
const int kCharsPerPixel = 3;

// class ECCImage {
//  public:
//   struct Block {
//     char data[6];
//   }

//   ECCImage();
//   virtual ~ECCImage();
  
//  private:
//   Block blocks_[85];
// };

}  // namespace cryptogram

#endif  // _ECC_IMAGE_H_
