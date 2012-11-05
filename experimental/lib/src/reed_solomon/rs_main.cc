#include "rslib.h"

int main(int argc, char** argv) {
  rs_control rs;
  uint16_t data;
  uint16_t par;
  encode_rs16(&rs, &data, 1, &par, 1);
  return 0;
}
