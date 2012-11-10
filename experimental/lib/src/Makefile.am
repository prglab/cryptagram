# Binaries.

TESTS =
bin_PROGRAMS = 
noinst_PROGRAMS =
noinst_LIBRARIES =

SUBDIRS = reed_solomon # cryptopp base

bin_PROGRAMS += jpeg_benchmark generate_aesthete_matrices \
			         read_aesthete_matrices aesthete_thread_runner queue_main

queue_main_SOURCES = queue_main.cc queue.h
queue_main_LDADD = -lpthread

aesthete_thread_runner_SOURCES = aesthete_thread_runner.cc
aesthete_thread_runner_CPPFLAGS = -Wall
aesthete_thread_runner_LDADD =
aesthete_thread_runner_LDADD += libaesthete_thread.a
aesthete_thread_runner_LDADD += libaesthete.a
aesthete_thread_runner_LDADD += libreentrant_rand.a
aesthete_thread_runner_LDADD += libexperiment.a
aesthete_thread_runner_LDADD += libarray.a
aesthete_thread_runner_LDADD += libjpeg_codec.a
aesthete_thread_runner_LDADD += -lpthread -lgflags

# bin_PROGRAMS = cryptogram_main
# cryptogram_main_SOURCES = main.cc discretizations.h util.h
# cryptogram_main_CPPFLAGS = -Wall
# cryptogram_main_LDADD = libjpeg_delta.a libjpeg_codec.a libcrypto.a libutils.a \
# 											  cryptopp/libcryptopp.a -lglog -ljpeg $(BOOST_SYSTEM_LIBS) \
# 												libbase64.a libmodp_b64.a libstring_piece.a

jpeg_benchmark_SOURCES = jpeg_benchmark.cc
jpeg_benchmark_LDADD = libaesthete.a libjpeg_codec.a libarray.a
jpeg_benchmark_LDADD += $(BOOST_SYSTEM_LIBS)
jpeg_benchmark_LDADD += -lgflags

generate_aesthete_matrices_SOURCES = generate_aesthete_matrices.cc
generate_aesthete_matrices_LDADD = libaesthete.a -lgflags -lglog

read_aesthete_matrices_SOURCES = read_aesthete_matrices.cc
read_aesthete_matrices_LDADD = libaesthete_thread.a
read_aesthete_matrices_LDADD += libaesthete.a
read_aesthete_matrices_LDADD += libexperiment.a
read_aesthete_matrices_LDADD += libreentrant_rand.a
read_aesthete_matrices_LDADD += libjpeg_codec.a
read_aesthete_matrices_LDADD += libarray.a
read_aesthete_matrices_LDADD += -lpthread -lgflags -lglog

noinst_LIBRARIES += libecc_experiment.a
libecc_experiment_a_SOURCES = ecc_experiment.cc ecc_experiment.h ecc_image.h

bin_PROGRAMS += ecc_experiment_main
ecc_experiment_main_SOURCES = ecc_experiment_main.cc
ecc_experiment_main_CPPFLAGS = -Wall
ecc_experiment_main_LDADD =  libecc_experiment.a
ecc_experiment_main_LDADD += libarray.a
ecc_experiment_main_LDADD += libaesthete.a
ecc_experiment_main_LDADD += libreentrant_rand.a
ecc_experiment_main_LDADD += libjpeg_codec.a
ecc_experiment_main_LDADD += reed_solomon/librs_codec.a
ecc_experiment_main_LDADD += reed_solomon/librs.a
ecc_experiment_main_LDADD += libecc_message.a
ecc_experiment_main_LDADD += -lgflags -lglog 
if USE_LIBTCMALLOC
  ecc_experiment_main_CPPFLAGS +=  \
    -fno-builtin-malloc \
		-fno-builtin-calloc \
		-fno-builtin-realloc \
		-fno-builtin-free
  ecc_experiment_main_LDADD += $(libtcmalloc_LIBS) -lprofiler
endif

bin_PROGRAMS += in_memory_experiment
in_memory_experiment_SOURCES = in_memory_experiment.cc
in_memory_experiment_CPPFLAGs = -Wall
in_memory_experiment_LDADD = \
	libaesthete_thread.a \
	libaesthete.a \
	libexperiment.a \
  libreentrant_rand.a \
	libjpeg_codec.a \
	libarray.a  \
	-lpthread -lgflags -lglog

if USE_LIBTCMALLOC
  in_memory_experiment_CPPFLAGS =  \
    -fno-builtin-malloc \
		-fno-builtin-calloc \
		-fno-builtin-realloc \
		-fno-builtin-free
  in_memory_experiment_LDADD += $(libtcmalloc_LIBS)
endif

# Libraries.

noinst_LIBRARIES += libjpeg_delta.a libjpeg_codec.a libCoder.a libmodp_b64.a
noinst_LIBRARIES += libbase64.a libstring_piece.a
noinst_LIBRARIES += libaesthete.a libaesthete_thread.a
noinst_LIBRARIES += libexperiment.a libarray.a

noinst_LIBRARIES += libecc_message.a
libecc_message_a_SOURCES = ecc_message.cc ecc_message.h

noinst_LIBRARIES += libreentrant_rand.a
libreentrant_rand_a_SOURCES = reentrant_rand.h reentrant_rand.cc
libreentrant_rand_a_CPPFLAGS = -Wall

libarray_a_SOURCES = array.cc array.h
libarray_a_CPPFLAGS = -Wall

TESTS += array_test
bin_PROGRAMS += array_test
array_test_SOURCES = array_test.cc
array_test_CPPFLAGS = -I$(top_srcdir)/include
array_test_LDFLAGS = -L..
array_test_LDADD =
array_test_LDADD += libarray.a
array_test_LDADD += $(top_srcdir)/lib/libgtest.la 
array_test_LDADD += $(top_srcdir)/lib/libgtest_main.la

libexperiment_a_SOURCES = experiment.cc experiment.h
libexperiment_a_CPPFLAGS = -Wall

libaesthete_a_SOURCES = aesthete.cc aesthete.h
libaesthete_a_CPPFLAGS = -Wall

libaesthete_thread_a_SOURCES = aesthete_thread.cc aesthete_thread.h queue.h types.h
libaesthete_thread_a_CPPFLAGS = -Wall
libaesthete_thread_a_LIBADD =

libjpeg_delta_a_SOURCES = jpeg_delta.cc jpeg_delta.h basictypes.h
libjpeg_delta_a_CPPFLAGS = -Wall

libjpeg_codec_a_SOURCES = jpeg_codec.cc jpeg_codec.h
libjpeg_codec_a_CPPFLAGS = -Wall

noinst_PROGRAMS += jpeg_codec_unittest
jpeg_codec_unittest_SOURCES = jpeg_codec_unittest.cc
jpeg_codec_unittest_CPPFLAGS = -I$(top_srcdir)/include
jpeg_codec_unittest_LDADD = $(top_srcdir)/lib/libgtest.la 
jpeg_codec_unittest_LDADD += libjpeg_codec.a
TESTS += jpeg_codec_unittest

libCoder_a_SOURCES = Coder.cc Coder.h
libCoder_a_CPPFLAGS = -Wall

libmodp_b64_a_SOURCES = modp_b64.h modp_b64.cc modp_b64_data.h

libbase64_a_SOURCES = base64.h base64.cc

noinst_PROGRAMS += base64_unittest
base64_unittest_SOURCES = base64_unittest.cc
base64_unittest_CPPFLAGS = -I$(top_srcdir)/include
base64_unittest_LDADD = $(top_srcdir)/lib/libgtest.la 
base64_unittest_LDADD += $(top_srcdir)/lib/libgtest_main.la 
base64_unittest_LDADD += libbase64.a
base64_unittest_LDADD +=libmodp_b64.a
TESTS += base64_unittest 

libstring_piece_a_SOURCES = string_piece.h string_piece.cc base_export.h
libstring_piece_a_SOURCES += hash_tables.h build_config.h string16.h

# noinst_LIBRARIES += libSjclCryptoBridge.a
# libSjclCryptoBridge_a_SOURCES = SjclCryptoBridge.h SjclCryptoBridge.cc

# noinst_LIBRARIES += libcrypto.a
# libcrypto_a_SOURCES = crypto.cc crypto.h

# noinst_LIBRARIES += libutils.a
# libutils_a_SOURCES = utils.h utils.cc

