#include "rs_codec.h"

#include "rslib.h"

namespace cryptogram {

RsCodec::RsCodec() {
  // Provides the standard Reed Solomon setup for RS(255, 223).
  rs_ = init_rs(8, 0x187, 0, 1, kRs255_223ParityBytes);
}

RsCodec::~RsCodec() {
  free_rs(rs_);
}

int RsCodec::Encode(uint8_t *data, uint16_t *parity) {
  return encode_rs8(rs_, data, kRs255_223MessageBytes, parity, 0);
}

int RsCodec::Decode(uint8_t *data, uint16_t *parity) {
  return decode_rs8(rs_, data, parity, kRs255_223MessageBytes, NULL, 0, NULL, 0,
                    NULL);
}

} // namespace cryptogram
