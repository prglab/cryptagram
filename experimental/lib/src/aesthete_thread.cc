#include "aesthete_thread.h"

#include <memory>

#include "aesthete.h"
#include "array.h"
#include "experiment.h"
#include "glog/logging.h"
#include "google/gflags.h"
#include "jpeg_codec.h"

DEFINE_int64(chunk_size, 50000, "Chunk size.");

namespace cryptogram {

// AestheteRunner Implementation.

AestheteRunner::AestheteRunner(int id, Queue* queue)
    : id_(id), done_(false), queue_(queue) {
  CHECK_NOTNULL(queue);
}

AestheteRunner::~AestheteRunner() {
}

void AestheteRunner::Start() {
  CHECK_EQ(pthread_create(&thread_, NULL, &AestheteRunner::Run, this), 0);
}

void AestheteRunner::Join() {
  CHECK_EQ(pthread_join(thread_, NULL), 0);
}

void* AestheteRunner::Run(void* context) {
  AestheteRunner* self = static_cast<AestheteRunner*>(context);

  // Initialize the name of the output file for this particular thread.
  ostringstream f_str_stream;
  f_str_stream << "out_" << self->id_ << ".txt";

  // Generate images.
  std::vector<int> discretizations;
  discretizations.push_back(240);
  discretizations.push_back(208);
  discretizations.push_back(176);
  discretizations.push_back(144);
  discretizations.push_back(112);
  discretizations.push_back(80);
  discretizations.push_back(48);
  discretizations.push_back(16);

  Experiment experiment(discretizations, f_str_stream.str());
  experiment.Init();
  vector<CharMatrix>* queue_entry = NULL;
  while(true) {
    // To avoid busy waiting on the queue, we use the timeout on the get() call
    // to the queue.
    void* queue_resp = self->queue()->get(false, 5);
    if (NULL == queue_resp) {
      if (self->done_) {
        break;
      }
      continue;
    }
    queue_entry = static_cast<vector<CharMatrix>*>(queue_resp);
    for (int i = 0; i < queue_entry->size(); i++) {
      MatrixRepresentation mr;
      mr.InitFromString((*queue_entry)[i].matrix);
      vector<int> matrix_entries;
      mr.ToInts(&matrix_entries);
      experiment.Run(matrix_entries);
    }
    self->queue()->task_done();
    delete queue_entry;
  }
  return NULL;
}

void AestheteRunner::Done() {
  done_ = true;
}

// AestheteReader Implementation.

AestheteReader::AestheteReader(const string& filename,
                               int id,
                               Queue* queue)
    : filename_(filename), done_(false), id_(id), queue_(queue) {
  CHECK_NOTNULL(queue);
}

AestheteReader::~AestheteReader() {
}

void AestheteReader::Start() {
  CHECK_EQ(pthread_create(&thread_, NULL, &AestheteReader::Run, this), 0);
}

void AestheteReader::Join() {
  CHECK_EQ(pthread_join(thread_, NULL), 0);
}

void AestheteReader::Done() {
  done_ = true;
}

void* AestheteReader::Run(void* context) {
//   AestheteReader* self = static_cast<AestheteReader*>(context);

//   // Read six bytes at a time.
//   std::filebuf in_file;
//   in_file.open(self->filename_.c_str(), std::ios::in);

//   cryptogram::MatrixRepresentation mr;
//   char matrix[7];
//   vector<int> ints;

//   vector<CharMatrix> *matrices = new vector<CharMatrix>();
//   matrices->reserve(FLAGS_chunk_size);
//   int matrix_count = 0;
//   while (true) {
//     // Run it through the cryptogram::MatrixRepresentation to get the
//     // discretizations.
//     bzero(matrix, 7);
//     streamsize ssize = in_file.sgetn(matrix, 6);
//     if (ssize <= 0) {
//       if (matrices->size() > 0) {
//         self->queue()->put(matrices, true, 0);
//       }
//       break;
//     }

//     if (matrix_count >= FLAGS_chunk_size) {
//       self->queue()->put(matrices, true, 0);
//       matrices->clear();
//       matrix_count = 0;
//     } else {
//       matrices->push_back(matrix);
//       matrix_count++;
//     }
//   }
  return NULL;
}

// Generator Implementation

namespace aesthete {

Generator::Generator(int id, int num_matrices, int chunk_size,
                     Queue* queue)
    : id_(id), num_matrices_(num_matrices), chunk_size_(chunk_size),
      queue_(queue) {
  CHECK_NOTNULL(queue);
}

Generator::~Generator() {
}

void Generator::Start() {
  CHECK_EQ(pthread_create(&thread_, NULL, &Generator::Run, this), 0);
}

void Generator::Join() {
  CHECK_EQ(pthread_join(thread_, NULL), 0);
}

void* Generator::Run(void* context) {
  Generator* self = static_cast<Generator*>(context);

  cryptogram::MatrixRepresentation mr;
  CharMatrix matrix;
  vector<int> ints;

  int matrices_generated = 0;
  while (matrices_generated < self->num_matrices_) {
    // Generate matrices for chunks while we have less than total matrices and
    // we have fewer than chunk size. Once generated, we add the vector to the
    // queue. If we have too many matrices now, we break.
    vector<CharMatrix>* matrices = new vector<CharMatrix>();
    matrices->reserve(FLAGS_chunk_size);
    for (int chunk_i = 0;
         matrices_generated < self->num_matrices_ &&
             chunk_i < self->chunk_size_;
         matrices_generated++, chunk_i++) {
      // Generate the random matrix.
      memset(matrix.matrix, 0, 7);
      for (int j = 0; j < 6; j++) {
        matrix.matrix[j] = rand() % 256; // rand() or j.
      }

      // Store the matrix in the vector<>;
      matrices->push_back(matrix);
    }
    // Push the vector of matrices on to the queue.
    self->queue_->put(matrices, true, 0);
  }
  std::cout << "Done generating matrices." << std::endl;
  return NULL;
}

} // namespace aesthete
} // namespace cryptogram
