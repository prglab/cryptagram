/*
 * experiment.h
 *
 *  Created on: Sep 18, 2012
 *      Author: tierney
 */

#ifndef EXPERIMENT_H_
#define EXPERIMENT_H_

#include "discretizations.h"

namespace cryptogram {

class Experiment {
 public:
  Experiment();

 private:
  Discretizations discretizations_;
};

} // namespace cryptogram

#endif /* EXPERIMENT_H_ */
