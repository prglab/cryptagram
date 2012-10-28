#ifndef _JPEG_FILE_H_
#define _JPEG_FILE_H_

#include <string>
#include <vector>

#include "google/protobuf/stubs/common.h"

namespace cryptogram {

class JpegFile {
 public:
  bool EncodeToFilename(const std::vector<unsigned char>& jpeg_encoded_data,
                        const std::string& filename);

  bool DecodeFromFilename(const std::string& filename,
                          std::vector<unsigned char>* decoded_data);

 private:
  GOOGLE_DISALLOW_EVIL_CONSTRUCTORS(JpegFile);
};

} // namespace cryptogram

#endif // _JPEG_FILE_H_
