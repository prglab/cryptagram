#include "rs.h"

namespace cryptogram {

RS::RS(int mm, int nn, int tt, int kk)
    : mm_(mm), nn_(nn), tt_(tt), kk_(kk) {
  pp_.reset(new int[mm]);

}

RS::~RS() {
}

string Encode(const string& data) {
}

string Decode(const string& data) {
}

void GenerateGF() {
  register int i, mask ;

  mask = 1;
  alpha_to[mm_] = 0;
  for (i = 0; i < mm; i++) {
    alpha_to[i] = mask;
    index_of[alpha_to[i]] = i ;
    if (pp[i]!=0)
      alpha_to[mm] ^= mask ;
    mask <<= 1 ;
  }
  index_of[alpha_to[mm]] = mm ;
  mask >>= 1 ;
  for (i=mm+1; i<nn; i++)
  { if (alpha_to[i-1] >= mask)
      alpha_to[i] = alpha_to[mm] ^ ((alpha_to[i-1]^mask)<<1) ;
    else alpha_to[i] = alpha_to[i-1]<<1 ;
    index_of[alpha_to[i]] = i ;
  }
  index_of[0] = -1 ;

}

} // namespace cryptogram
