// Copyright (c) 2012 The Cryptogram Authors. BSD-Style License.
//
// TODO(tierney): Match parity with cryptopp with what we get from SJCL.
//
// In Objective C, this probably looks like the following for the PBKDF2
// production.
//
// #import <CommonCrypto/CommonKeyDerivation.h>

// ...

// // Makes a random 256-bit salt
// - (NSData*)generateSalt256 {
//     unsigned char salt[32];
//     for (int i=0; i<32; i++) {
//         salt[i] = (unsigned char)arc4random();
//     }
//     return [NSData dataWithBytes:salt length:32];
// }

// ...

// // Make keys!
// NSString* myPass = @"MyPassword1234";
// NSData* myPassData = [myPass dataUsingEncoding:NSUTF8StringEncoding];
// NSData* salt = [self generateSalt256];

// // How many rounds to use so that it takes 0.1s ?
// int rounds = CCCalibratePBKDF(kCCPBKDF2, myPassData.length, salt.length,
//                               kCCPRFHmacAlgSHA256, 32, 100);

// // Open CommonKeyDerivation.h for help
// unsigned char key[32];
// CCKeyDerivationPBKDF(kCCPBKDF2, myPassData.bytes, myPassData.length, salt.bytes,
//                      salt.length, kCCPRFHmacAlgSHA256, rounds, key, 32);

#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <vector>

#include "boost/scoped_ptr.hpp"
#include "crypto.h"

#include "cryptopp/pwdbased.h"
#include "cryptopp/ccm.h"
#include "cryptopp/cryptlib.h"
#include "cryptopp/filters.h"
#include "cryptopp/hmac.h"
#include "cryptopp/osrng.h"
#include "cryptopp/sha.h"

#include "base64.h"
#include "discretizations.h"
#include "experiment.h"
#include "glog/logging.h"
#include "jpeg_codec.h"
#include "util.h"
#include "utils.h"

namespace cryptogram {

// Generates the random values to fill @entries based on random choices of the
// values in @values.
void GenerateRandomRgbArray(
    const int* values,
    const int num_values,
    const int num_rgb_pixels,
    unsigned char* entries) {
  CHECK_NOTNULL(entries);
  CHECK_NOTNULL(values);

  for (int i = 0; i < num_rgb_pixels; i++) {
    size_t val_index = rand() % num_values;
    int value = values[val_index];
    entries[(3 * i)] = value;
    entries[(3 * i) + 1] = value;
    entries[(3 * i) + 2] = value;
  }
}

class RgbImageMatrix {
 public:
  struct Pixel {
    Pixel(Byte red, Byte green, Byte blue);

    Byte red;
    Byte green;
    Byte blue;
  };


 private:
  int width_;
  int height_;

  // GOOGLE_DISALLOW_EVIL_CONSTRUCTORS(RgbImageMatrix);
};

} // namespace cryptogram

int main(int argc, char** argv) {
  google::InitGoogleLogging(argv[0]);

  // crypto::Crypto crypto_obj;

  // // Salt appears to be a random 8 character string.
  // std::string salt = base::RandomString(8);
  // std::cout << "salt: " << base::Base64Encode(salt) << std::endl;

  // std::string res = crypto_obj.SecurePassword("hello world",
  //                                             salt,
  //                                             100);
  // std::cout << "Size of SecurePassword " << res.size() << std::endl;
  // std::cout << "Size of SecurePassword " << base::EncodeToBase64(res) << std::endl;

  // std::string key = base::RandomString(128 / 32);
  // std::cout << "key: " << base::Base64Encode(key) << std::endl;

  // std::string iv = base::RandomString(crypto::AES256_IVSize);
  // std::cout << "iv: " << base::Base64Encode(iv) << std::endl;

  // crypto::Crypto crypto;
  // std::string encrypted = crypto.SymmEncrypt("hello world",
  //                                            "",
  //                                            crypto::STRING_STRING,
  //                                            key + iv);
  // std::string base64_encrypted;
  // CHECK(base::Base64Encode(encrypted, &base64_encrypted));
  // std::cout << base64_encrypted << std::endl;

  // for (int i = 0; i < res.size(); i++) {
  //   printf("%x ", res[i]);
  // }

  // iv = base::Base64Decode("RafaC0jLpQp7SgSnH5xvDA==");
  // salt = base::Base64Decode("lHY6fRfb/a4=");
  // encrypted = "cHbpI1tiK12obiPJ2Kh395NO4g==";
  // std::cout << crypto.SymmDecrypt(encrypted, "",
  //                                 crypto::STRING_STRING,
  //                                 key + iv) << std::endl;

  CryptoPP::AutoSeededRandomPool prng;

  // 16 byte keys.
  CryptoPP::SecByteBlock key( CryptoPP::AES::DEFAULT_KEYLENGTH );
  prng.GenerateBlock( key, key.size() );

  // { 7, 8, 9, 10, 11, 12, 13 }
  byte iv[ 9 ];
  prng.GenerateBlock( iv, sizeof(iv) );

  // { 4, 6, 8, 10, 12, 14, 16 }
  const int TAG_SIZE = 8;

  // Plain text
  std::string pdata = "Authenticated Encryption";

  // Encrypted, with Tag
  std::string cipher;

  // Recovered plain text
  std::string rpdata;

  /*********************************\
\*********************************/

  try {
    CryptoPP::CCM< CryptoPP::AES, TAG_SIZE >::Encryption e;
    e.SetKeyWithIV( key, key.size(), iv, sizeof(iv) );
    e.SpecifyDataLengths( 0, pdata.size(), 0 );

    CryptoPP::StringSource(
        pdata,
        true,
        new CryptoPP::AuthenticatedEncryptionFilter(
            e,
            new CryptoPP::StringSink( cipher )
                                                    ) // AuthenticatedEncryptionFilter
                           ); // StringSource
  } catch( CryptoPP::Exception& e ) {
    std::cerr << "Caught Exception..." << std::endl;
    std::cerr << e.what() << std::endl;
    std::cerr << std::endl;
  }

  // char civ[ 9 ];
  // for (int i = 0; i < 9; i++) {
  //   civ[i] = iv[i];
  //   // std::cout << civ[i] << " " << iv[i] << std::endl;
  // }

  std::string civ;

  std::cout << civ << std::endl;
  std::cout << key.size() << std::endl;
  std::cout << base::EncodeToBase64(cipher) << std::endl;

  /*********************************            \
\*********************************/

  try {
    CryptoPP::CCM< CryptoPP::AES, TAG_SIZE >::Decryption d;
    d.SetKeyWithIV( key, key.size(), iv, sizeof(iv) );
    d.SpecifyDataLengths( 0, cipher.size()-TAG_SIZE, 0 );

    CryptoPP::AuthenticatedDecryptionFilter df( d,
                                      new CryptoPP::StringSink( rpdata )
                                      ); // AuthenticatedDecryptionFilter

    // The StringSource dtor will be called immediately
    //  after construction below. This will cause the
    //  destruction of objects it owns. To stop the
    //  behavior so we can get the decoding result from
    //  the DecryptionFilter, we must use a redirector
    //  or manually Put(...) into the filter without
    //  using a StringSource.
    CryptoPP::StringSource( cipher, true,
                  new CryptoPP::Redirector( df )
                  ); // StringSource

    // If the object does not throw, here's the only
    //  opportunity to check the data's integrity
    if( true == df.GetLastResult() ) {
      std::cout << "recovered text: " << rpdata << std::endl;
    }
  } catch( CryptoPP::Exception& e ) {
    std::cerr << "Caught Exception..." << std::endl;
    std::cerr << e.what() << std::endl;
    std::cerr << std::endl;
  }


  return 0;
}

int unused() {
  LOG(INFO) << "Initializng the random number generator.";
  srand(0);

  const int values[] = { 64, 172 };
  const int num_values = 3;
  const int num_rgb_pixels = 8 * 8;
  const int num_bytes = num_rgb_pixels * 3;

  unsigned char array[num_bytes];
  bzero(array, num_bytes);

  for (int trial = 0; trial < 1000000; trial++) {
    if (trial % 100000 == 0) {
      printf("Trial: %d\n", trial);
    }
    cryptogram::GenerateRandomRgbArray(values, num_values, num_rgb_pixels, array);

    std::vector<unsigned char> output;

    int width = 8;
    int height = 8;
    int quality = 72;
    bool result = gfx::JPEGCodec::Encode(array,
                                         gfx::JPEGCodec::FORMAT_RGB,
                                         width,
                                         height,
                                         width * cryptogram::kBytesPerWidthEntry,
                                         quality,
                                         &output);

    // if (result) {
    //   std::ofstream out_file("test.jpg", std::ios::out | std::ios::binary);
    //   for (const unsigned char val : output) {
    //     out_file << val;
    //   }
    //   out_file.close();
    // }

    // cryptogram::Experiment experiment;

    // std::ifstream in_file("test.jpg", std::ios::binary);
    // in_file.seekg (0, std::ios::end);
    // int length = in_file.tellg();
    // in_file.seekg (0, std::ios::beg);
    // std::cout << length << std::endl;
    // boost::scoped_ptr<char> buffer(new char[length]);
    // in_file.read(buffer.get(), length);
    // in_file.close();

    const int length = output.size();
    unsigned char uchars[length];
    // for (int i = 0; i < length; i++) {
    //   uchars[i] = buffer.get()[i];
    // }
    cryptogram::UcharVectorToArray(output, length, uchars);

    output.clear();
    result = gfx::JPEGCodec::Decode(uchars,
                                    length,
                                    gfx::JPEGCodec::FORMAT_RGB,
                                    &output,
                                    &width,
                                    &height);
  }
  // if (result) {
  //   for (const unsigned char val : output) {
  //     printf("%d ", val);
  //   }
  // }

  return 0;
}
