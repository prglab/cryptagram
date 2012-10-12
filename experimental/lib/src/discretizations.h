/*
 * discretizations.h
 *
 *  Created on: Sep 18, 2012
 *      Author: tierney
 */

#ifndef DISCRETIZATIONS_H_
#define DISCRETIZATIONS_H_

#include <set>

namespace cryptogram {

class Discretizations {
 public:
  enum Distribution {
    EQUAL = 0,
  };

  Discretizations();

 private:
  Distribution distribution_;
  std::set<int> values_;
};

}  // namespace cryptogram

#endif /* DISCRETIZATIONS_H_ */
