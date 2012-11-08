# Binaries.

SUBDIRS = reed_solomon # cryptopp base 

bin_PROGRAMS = jpeg_benchmark generate_aesthete_matrices \
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
# 											  cryptopp/libcryptopp.a -lglog -ljpeg -lboost_system-mt \
# 												libbase64.a libmodp_b64.a libstring_piece.a

jpeg_benchmark_SOURCES = jpeg_benchmark.cc
jpeg_benchmark_LDADD = libaesthete.a libjpeg_codec.a libarray.a
jpeg_benchmark_LDADD += -lboost_system$(BOOST_LIB_SUFFIX)
jpeg_benchmark_LDADD += -lboost_thread$(BOOST_LIB_SUFFIX) 
jpeg_benchmark_LDADD += -lgflags

generate_aesthete_matrices_SOURCES = generate_aesthete_matrices.cc
generate_aesthete_matrices_LDADD = libaesthete.a -lgflags -lglog

read_aesthete_matrices_SOURCES = read_aesthete_matrices.cc
read_aesthete_matrices_LDADD = libaesthete_thread.a  libaesthete.a libexperiment.a \
  libreentrant_rand.a \
   libjpeg_codec.a libarray.a  -lpthread -lgflags -lglog

bin_PROGRAMS += ecc_experiment
ecc_experiment_SOURCES = ecc_experiment.cc ecc_image.h
ecc_experiment_CPPFLAGS = -Wall
ecc_experiment_LDADD = \
  libarray.a \
	libaesthete.a \
  libreentrant_rand.a \
	libjpeg_codec.a \
	reed_solomon/librs_codec.a \
	reed_solomon/librs.a \
	-lgflags

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

noinst_LIBRARIES = libjpeg_delta.a libjpeg_codec.a libCoder.a libmodp_b64.a
noinst_LIBRARIES += libbase64.a libstring_piece.a 
noinst_LIBRARIES += libaesthete.a libaesthete_thread.a
noinst_LIBRARIES += libexperiment.a libarray.a

noinst_LIBRARIES += libreentrant_rand.a
libreentrant_rand_a_SOURCES = reentrant_rand.h reentrant_rand.cc
libreentrant_rand_a_CPPFLAGS = -Wall

libarray_a_SOURCES = array.cc array.h
libarray_a_CPPFLAGS = -Wall

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

libCoder_a_SOURCES = Coder.cc Coder.h
libCoder_a_CPPFLAGS = -Wall

libmodp_b64_a_SOURCES = modp_b64.h modp_b64.cc modp_b64_data.h

libbase64_a_SOURCES = base64.h base64.cc

libstring_piece_a_SOURCES = string_piece.h string_piece.cc base_export.h
libstring_piece_a_SOURCES += hash_tables.h build_config.h string16.h

# noinst_LIBRARIES += libSjclCryptoBridge.a
# libSjclCryptoBridge_a_SOURCES = SjclCryptoBridge.h SjclCryptoBridge.cc

# noinst_LIBRARIES += libcrypto.a
# libcrypto_a_SOURCES = crypto.cc crypto.h

# noinst_LIBRARIES += libutils.a 
# libutils_a_SOURCES = utils.h utils.cc

