#include "aesthete_thread.h"

#include "aesthete.h"
#include "array.h"
#include "experiment.h"
#include "glog/logging.h"
#include "google/gflags.h"
#include "jpeg_codec.h"

DEFINE_int32(chunk_size, 1000, "Chunk size.");

namespace cryptogram {

// AestheteRunner Implementation.

AestheteRunner::AestheteRunner(int i, MatrixQueue* queue)
    : i_(i), done_(false), queue_(queue) {
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
  
  ostringstream f_str_stream;
  f_str_stream << "out_" << self->i_ << ".txt";
  ofstream f_stream(f_str_stream.str().c_str(), ofstream::binary);

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

  Experiment experiment(discretizations);
  
  while(!self->done_) {
    MatrixQueueEntry queue_entry;
    if (!self->queue()->get(false, 5, &queue_entry)) {
      continue;
    }
    for (int i = 0; i < queue_entry.size(); i++) {
      MatrixRepresentation mr(queue_entry[i]);
      vector<int> matrix_entries;
      mr.ToInts(&matrix_entries);
      experiment.Run(matrix_entries, &f_stream);
    }
    self->queue()->task_done();
  }
  return NULL;
}

void AestheteRunner::Done() {
  done_ = true;
}

// AestheteReader Implementation.

AestheteReader::AestheteReader(const string& filename,
                               int i,
                               MatrixQueue* queue)
    : filename_(filename), done_(false), i_(i), queue_(queue) {
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
  AestheteReader* self = static_cast<AestheteReader*>(context);
  
  // Read six bytes at a time.
  std::filebuf in_file;
  in_file.open(self->filename_.c_str(), std::ios::in);
  
  cryptogram::MatrixRepresentation mr;
  char matrix[7];
  vector<int> ints;

  vector<bitset<48> > matrices;
  matrices.reserve(FLAGS_chunk_size);
  int matrix_count = 0;
  while (true) {
    // Run it through the cryptogram::MatrixRepresentation to get the
    // discretizations.
    bzero(matrix, 7);
    streamsize ssize = in_file.sgetn(matrix, 6);
    if (ssize <= 0) {
      if (matrices.size() > 0) {
        self->queue()->put(matrices, true, 0);
      }
      break;
    }

    bitset<48> bits;
    cryptogram::MatrixRepresentation::BitsetFromBytes(matrix, &bits);
    if (matrix_count >= FLAGS_chunk_size) {
      self->queue()->put(matrices, true, 0);
      matrices.clear();
      matrix_count = 0;
    } else {
      matrices.push_back(bits);
      matrix_count++;
    }
  }
  return NULL;
}

} // namespace cryptogram
