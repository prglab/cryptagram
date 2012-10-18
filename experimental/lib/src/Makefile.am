# Binaries.

bin_PROGRAMS = cryptogram_main jpeg_benchmark

cryptogram_main_SOURCES = main.cc discretizations.h experiment.h util.h
cryptogram_main_CPPFLAGS = -Wall
cryptogram_main_LDADD = libjpeg_delta.a libjpeg_codec.a libcrypto.a libutils.a \
											  cryptopp/libcryptopp.a -lglog -ljpeg -lboost_system \
												libbase64.a libmodp_b64.a libstring_piece.a

jpeg_benchmark_SOURCES = jpeg_benchmark.cc
jpeg_benchmark_LDADD = libjpeg_codec.a -lboost

SUBDIRS = cryptopp

# Libraries.

noinst_LIBRARIES = libjpeg_delta.a libjpeg_codec.a libCoder.a libmodp_b64.a
noinst_LIBRARIES += libbase64.a libstring_piece.a libSjclCryptoBridge.a
noinst_LIBRARIES += libcrypto.a libutils.a

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

