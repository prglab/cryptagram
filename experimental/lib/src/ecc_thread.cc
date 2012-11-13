#include "ecc_thread.h"

#include <fstream>
#include <iostream>

#include "ecc_experiment.h"
#include "glog/logging.h"
#include "google/gflags.h"

DECLARE_int32(quality);

namespace cryptogram {

EccThread::EccThread(int id, int iterations)
    : id_(id), iterations_(iterations) {
}

EccThread::~EccThread() {
}

void EccThread::Start() {
  CHECK_EQ(pthread_create(&thread_, NULL, &EccThread::Run, this), 0);
}

void EccThread::Join() {
  CHECK_EQ(pthread_join(thread_, NULL), 0);
}

void* EccThread::Run(void* context) {
  EccThread* self = static_cast<EccThread*>(context);

  std::ostringstream f_str_stream;
  f_str_stream << "ecc_out_iters_"
               << self->iterations_
               << "_quality_"
               << FLAGS_quality
               << "_"
               << self->id_
               << ".txt";
  
  EccExperiment experiment(f_str_stream.str());
  for (int iteration = 0; iteration < self->iterations_; iteration++) {
    experiment.Run();
  }

  return NULL;
}

} // namespace cryptogram
