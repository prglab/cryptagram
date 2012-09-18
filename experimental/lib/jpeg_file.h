#ifndef _JPEG_FILE_H_
#define _JPEG_FILE_H_

#include <string>

namespace cryptogram {

class JpegFile {
 public:
  JpegFile(const std::string& filename,
           const unsigned char& array,
           int width,
           int height,
           int quality);

  virtual ~JpegFile();

  bool EncodeToFile();

  bool DecodeFromFile();

 private:
  std::string filename_;
  unsigned char array_;
  int width_;
  int height_;
  int quality_;
};

} // namespace cryptogram

#endif // _JPEG_FILE_H_
