# Binaries.

bin_PROGRAMS = cryptogram_main jpeg_benchmark generate_aesthete_matrices \
			         read_aesthete_matrices aesthete_thread_runner queue_main

queue_main_SOURCES = queue_main.cc queue.h
queue_main_LDADD = -lpthread

aesthete_thread_runner_SOURCES = aesthete_thread_runner.cc
aesthete_thread_runner_CPPFLAGS = -Wall
aesthete_thread_runner_LDADD = libaesthete.a libaesthete_thread.a -lpthread 

cryptogram_main_SOURCES = main.cc discretizations.h util.h
cryptogram_main_CPPFLAGS = -Wall
cryptogram_main_LDADD = libjpeg_delta.a libjpeg_codec.a libcrypto.a libutils.a \
											  cryptopp/libcryptopp.a -lglog -ljpeg -lboost_system-mt \
												libbase64.a libmodp_b64.a libstring_piece.a

jpeg_benchmark_SOURCES = jpeg_benchmark.cc
jpeg_benchmark_LDADD = libaesthete.a libjpeg_codec.a -lboost_system \
  -lboost_thread -lgflags

generate_aesthete_matrices_SOURCES = generate_aesthete_matrices.cc
generate_aesthete_matrices_LDADD = libaesthete.a -lgflags -lglog 

read_aesthete_matrices_SOURCES = read_aesthete_matrices.cc
read_aesthete_matrices_LDADD = libaesthete_thread.a libjpeg_codec.a libaesthete.a libexperiment.a \
   libarray.a  -lpthread -lgflags -lglog

SUBDIRS = cryptopp base reed_solomon

# Libraries.

noinst_LIBRARIES = libjpeg_delta.a libjpeg_codec.a libCoder.a libmodp_b64.a
noinst_LIBRARIES += libbase64.a libstring_piece.a libSjclCryptoBridge.a
noinst_LIBRARIES += libcrypto.a libutils.a libaesthete.a libaesthete_thread.a
noinst_LIBRARIES += libexperiment.a libarray.a

libarray_a_SOURCES = array.cc array.h
libarray_a_CPPFLAGS = -Wall

libexperiment_a_SOURCES = experiment.cc experiment.h
libexperiment_a_CPPFLAGS = -Wall

libaesthete_a_SOURCES = aesthete.cc aesthete.h
libaesthete_a_CPPFLAGS = -Wall

libaesthete_thread_a_SOURCES = aesthete_thread.cc aesthete_thread.h
libaesthete_thread_a_CPPFLAGS = -Wall

libjpeg_delta_a_SOURCES = jpeg_delta.cc jpeg_delta.h basictypes.h
libjpeg_delta_a_CPPFLAGS = -Wall

libjpeg_codec_a_SOURCES = jpeg_codec.cc jpeg_codec.h
libjpeg_codec_a_CPPFLAGS = -Wall

libCoder_a_SOURCES = Coder.cc Coder.h
libCoder_a_CPPFLAGS = -Wall

libmodp_b64_a_SOURCES = modp_b64.h modp_b64.cc modp_b64_data.h

libbase64_a_SOURCES = base64.h base64.cc

libstring_piece_a_SOURCES = string_piece.h string_piece.cc base_export.h
libstring_piece_a_SOURCES += hash_tables.h build_config.h string16.h

libSjclCryptoBridge_a_SOURCES = SjclCryptoBridge.h SjclCryptoBridge.cc

libcrypto_a_SOURCES = crypto.cc crypto.h

libutils_a_SOURCES = utils.h utils.cc

