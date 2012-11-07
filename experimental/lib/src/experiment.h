/*
 * experiment.h
 *
 *  Created on: Sep 18, 2012
 *      Author: tierney
 */

#ifndef EXPERIMENT_H_
#define EXPERIMENT_H_

#include <fstream>
#include <vector>

namespace cryptogram {

class Experiment {
 public:
  explicit Experiment(const std::vector<int>& discretizations);

  // Returns the number of errors found in the experiment.
  int Run(const std::vector<int>& matrix_entries, std::ofstream* out_fstream);
  
 private:
  std::vector<int> discretizations_;
  
  Experiment(const Experiment&);
  void operator=(const Experiment&);
};

} // namespace cryptogram

#endif /* EXPERIMENT_H_ */
