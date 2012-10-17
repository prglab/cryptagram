#ifndef _SJCL_CRYPTO_BRIDGE_H_
#define _SJCL_CRYPTO_BRIDGE_H_

#include "cryptopp/cryptlib.h"
#include "basictypes.h"

namespace cryptogram {

class SjclCryptoBridge {
 public:
  SjclCryptoBridge();
  virtual ~SjclCryptoBridge();

  void Run();
  
 private:
  DISALLOW_COPY_AND_ASSIGN(SjclCryptoBridge);
};

} // namespace cryptogram


#endif  // _SJCL_CRYPTO_BRIDGE_H_
