#ifndef _ECC_EXPERIMENT_H_
#define _ECC_EXPERIMENT_H_

namespace cryptogram {

class EccExperiment {
 public:
  EccExperiment() :
      decoded_blocks(array<matrix<unsigned char> *>(kBlocksWide, kBlocksHigh)),
      decoded_aes(array<matrix<unsigned char> *>(kBlocksWide, kBlocksHigh)),
      blocks(array<matrix<unsigned char> *>(kBlocksWide, kBlocksHigh)),
      aes_blocks(array<matrix<unsigned char> *>(kBlocksWide, kBlocksHigh)) {
  }


  
 private:
  EccMessage ecc_msg_;

  array<matrix<unsigned char> *> decoded_blocks;
  array<matrix<double> *> decoded_aes(kBlocksWide, kBlocksHigh);
  array<matrix<unsigned char> *> blocks(kBlocksWide, kBlocksHigh);
  array<matrix<double> *> aes_blocks(kBlocksWide, kBlocksHigh);

};


} // namespace cryptogram

#endif  // _ECC_EXPERIMENT_H_
