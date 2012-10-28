#include <string>

#include "boost/scoped_array.hpp"

using std::string;
using boost::scoped_array;

namespace cryptogram {

class RS {
 public:
  RS(int mm, int nn, int tt, int kk);

  virtual ~RS();

  string Encode(const string& data);

  string Decode(const string& data);

 private:
  void GenerateGF();
  void GeneratePoly();

  int mm_;
  int nn_;
  int tt_;
  int kk_;

  scoped_array<int> pp_;
  scoped_array<int> alpha_to_;
  scoped_array<int> index_of_;
  scoped_array<int> gg_;
  scoped_array<int> received_;
  scoped_array<int> bb_;

  DISALLOW_COPY_AND_ASSIGN(RS);
};

} // namespace cryptogram
