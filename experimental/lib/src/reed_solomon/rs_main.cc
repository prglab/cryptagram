#include <cstdlib>
#include <ctime>
#include <iostream>
#include "rslib.h"

void printf_data(uint8_t *data, size_t len) {
  for (int i = 0; i < len; i++) {
    std::cout << (int)data[i];
  }
  std::cout << std::endl;
}

int main(int argc, char** argv) {
  srand(time(NULL));
  
  /* Symbolsize is 10 (bits)
   * Primitive polynomial is x^10+x^3+1
   * first consecutive root is 0
   * primitive element to generate roots = 1
   * generator polynomial degree (number of roots) = 6
   */
  rs_control *rs = init_rs(10, 0x409, 0, 1, 6);
  /* Parity buffer. Size = number of roots */
  uint16_t par[6];
  /* Initialize the parity buffer */
  memset(par, 0, sizeof(par));
  /* Encode 512 byte in data8. Store parity in buffer par */
  uint8_t orig_copy[512];
  uint8_t  data[512];
  for (int i = 0; i < 512; i++) {
    memset(data + i, 1, 1);
  }
  std::cout << "Original data:" << std::endl;
  printf_data(data, 512);
  memmove(orig_copy, data, 512);
  
  {
  int nerrors = 0;
  for (int i = 0; i < 512; i++) {
    if (orig_copy[i] != data[i]) {
      nerrors++;
    }
  }
  std::cout << "Differences: " << nerrors << std::endl;;
  }
  
  encode_rs8 (rs, data, 512, par, 0);
  std::cout << "Encoded data:" << std::endl;
  std::cout << "Parity: " << std::endl;
      
  printf_data(data, 512);
  {
    for (int i = 0; i < 6; i++) {
      std::cout << par[i] << " ";
    }
    std::cout << std::endl;
  }

  int nchanges = 0;
  for (int i = 0; i < 512; i++) {
    if (rand() % 100 == 0) {
      memset(data + i, 0, 1);
      nchanges++;
    }
  }
  std::cout << "Sent data: " << std::endl;
  printf_data(data, 512);
  
  int numerr = decode_rs8(rs, data, par, 512, NULL, 0, NULL, 0, NULL);
  std::cout << "Num errors: " << numerr << std::endl;
  std::cout << "Decoded data:" << std::endl;
  printf_data(data, 512);

  {
  int nerrors = 0;
  for (int i = 0; i < 512; i++) {
    if (orig_copy[i] != data[i]) {
      nerrors++;
    }
  }
  std::cout << "Differences: " << nerrors;
  }
  
  return 0;
}
