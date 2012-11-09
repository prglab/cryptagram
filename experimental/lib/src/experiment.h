/*
 * experiment.h
 *
 *  Created on: Sep 18, 2012
 *      Author: tierney
 */

#ifndef EXPERIMENT_H_
#define EXPERIMENT_H_

#include <iostream>
#include <fstream>
#include <string>
#include <vector>

namespace cryptogram {

// This class drives the aesthete experiment without ECC. This is not a
// thread-safe class. Experiment is designed to run the compression and
// decompression algorithms, compare the results to computer the number of
// errors, and, if there are errors, write out the number of errors and the
// matrix to @output_filename.
class Experiment {
 public:
  Experiment(const std::vector<int>& discretizations,
             const std::string& output_filename);

  // Initialization method that sets the f_stream_ according to the
  // output_filename.
  void Init();

  // Returns the number of errors found in the experiment.
  int Run(const std::vector<int>& matrix_entries);

 private:
  std::vector<int> discretizations_;
  std::string output_filename_;

  std::ofstream f_stream_;

  Experiment(const Experiment&);
  void operator=(const Experiment&);
};

} // namespace cryptogram

#endif /* EXPERIMENT_H_ */
