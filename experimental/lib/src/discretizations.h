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

struct DiscreteValue {
  explicit DiscreteValue(double input) { data = input; }
  double data;
};

// These comparisons are constructed assuming a greater or descending order in
// the set. You must reverse DiscretizationCompare and upper_bound and the final
// greater-than comparison in order to convert this code into correct
// functionality for ascending ordered sets.
struct DiscretizationCompare {
  bool operator()(const DiscreteValue& left,
                  const DiscreteValue& right) const {
    return left.data > right.data;
  }
};

typedef std::set<DiscreteValue, DiscretizationCompare> Discretizations;

inline Discretizations::iterator FindClosest(const Discretizations& data,
                                             const DiscreteValue& searchkey) {
  Discretizations::iterator upper = data.upper_bound(searchkey);
  if (upper == data.begin() || upper->data == searchkey.data) {
    return upper;
  }

  Discretizations::iterator lower = upper;
  --lower;
  if (upper == data.end() ||
      (searchkey.data - lower->data) > (upper->data - searchkey.data)) {
    return lower;
  }
  return upper;
}

}  // namespace cryptogram

#endif /* DISCRETIZATIONS_H_ */
