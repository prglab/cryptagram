#include "aesthete_thread.h"

#include "glog/logging.h"

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

  MatrixQueueEntry queue_entry;
  fstream f_stream;
  
  ostringstream f_str_stream;
  f_str_stream << "out_" << self->i_ << ".txt";
  f_stream.open(f_str_stream.str(), ios::out);
  while(true) {
    int ret = self->queue()->PopRandom(&queue_entry);
    if (ret <= 0) {
      if (self->done_) {
        break;
      }
      sleep(1);
      continue;
    }

    for (int i = 0; i < queue_entry.size(); i++) {
      MatrixRepresentation mr(queue_entry[i]);

      vector<int> matrix_entries;
      mr.ToInts(&matrix_entries);
      f_stream
    }
  }
  return NULL;
}

void AestheteRunner::Done() {
  done_ = true;
}

// AestheteReader Implementation.

AestheteReader::AestheteReader(int i, MatrixQueue* queue)
    : i_(i), queue_(queue) {
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

void* AestheteReader::Run(void* context) {
  // Read six bytes at a time.
  std::filebuf in_file;
  in_file.open("test", std::ios::in);
  
  cryptogram::MatrixRepresentation mr;
  char matrix[7];
  vector<int> ints;

  vector<bitset<48> >* matrices = new vector<bitset<48> >();
  matrices->reserve(1000);
  int matrix_count = 0;
  for (int j = 0; j < 10000000; j++) {
    // Run it through the cryptogram::MatrixRepresentation to get the
    // discretizations.
    bzero(matrix, 7);
    in_file.sgetn(matrix, 6);

    bitset<48> bits;
    cryptogram::MatrixRepresentation::BitsetFromBytes(matrix, &bits);
    if (matrix_count >= 1000) {
      static_cast<AestheteReader*>(context)->queue()->Push(matrices);
      matrices = new vector<bitset<48> >();
      matrix_count = 0;
    } else {
      matrices->push_back(bits);
      matrix_count++;
    }
  }
  return NULL;
}

} // namespace cryptogram
