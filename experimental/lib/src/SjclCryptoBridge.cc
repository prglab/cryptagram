#include "SjclCryptoBridge.h"

#include "boost/scoped_array.hpp"
#include "cryptopp/pwdbased.h"
#include "cryptopp/cryptlib.h"
#include "cryptopp/hmac.h"
#include "cryptopp/sha.h"

namespace cryptogram {

SjclCryptoBridge::SjclCryptoBridge() {
}

SjclCryptoBridge::~SjclCryptoBridge() {
}

void SjclCryptoBridge::Run() {
  // unsigned int ret = 0;
  // CryptoPP::PKCS5_PBKDF2_HMAC<CryptoPP::HMAC<CryptoPP::SHA256> > myhash;
  // size_t derived_len = 100;
  // boost::scoped_array<byte> derived(derived_len);
  // ret = myhash.DeriveKey(
  //     &derived,
  //     derived_len,
  //     0,
// );
}

} // namespace cryptogram
