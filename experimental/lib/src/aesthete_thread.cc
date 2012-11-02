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

AestheteRunner::AestheteRunner(int i, Queue* queue)
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
  std::vector<int> values;
  values.push_back(240);
  values.push_back(208);
  values.push_back(176);
  values.push_back(144);
  values.push_back(112);
  values.push_back(80);
  values.push_back(48);
  values.push_back(16);

  Experiment experiment(values);
  
  while(!self->done_) {
    void *queue_entry;
    if (!self->queue()->get(true, 5, &queue_entry)) {
      LOG(ERROR) << "Got nothing.";
      continue;
    }
    for (int i = 0; i < static_cast<MatrixQueueEntry>(queue_entry)->size(); i++) {
      MatrixRepresentation mr((*static_cast<MatrixQueueEntry>(queue_entry))[i]);
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
                               Queue* queue)
    : filename_(filename), i_(i), done_(false), queue_(queue) {
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

  vector<bitset<48> > *matrices = new vector<bitset<48> >();
  matrices->reserve(FLAGS_chunk_size);
  int matrix_count = 0;
  while (!self->done_) {
    // Run it through the cryptogram::MatrixRepresentation to get the
    // discretizations.
    bzero(matrix, 7);
    streamsize ssize = in_file.sgetn(matrix, 6);
    if (ssize <= 0) {
      if (matrices->size() > 0) {
        static_cast<AestheteReader*>(context)->queue()->put(true, 0, matrices);
      }
      sleep(1);
    }

    bitset<48> bits;
    cryptogram::MatrixRepresentation::BitsetFromBytes(matrix, &bits);
    if (matrix_count >= FLAGS_chunk_size) {
      static_cast<AestheteReader*>(context)->queue()->put(matrices, true, 0);
      matrices = new vector<bitset<48> >();
      matrix_count = 0;
    } else {
      matrices->push_back(bits);
      matrix_count++;
    }
  }
  in_file.close();
  return NULL;
}

} // namespace cryptogram
