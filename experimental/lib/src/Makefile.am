# Binaries.

bin_PROGRAMS = cryptogram_main
cryptogram_main_SOURCES = main.cc discretizations.h experiment.h util.h
cryptogram_main_CPPFLAGS = -Wall
cryptogram_main_LDADD = libjpeg_delta.a libjpeg_codec.a -ljpeg -lglog

# Libraries.

noinst_LIBRARIES = libjpeg_delta.a libjpeg_codec.a libCoder.a libmodp_b64.a
noinst_LIBRARIES += libbase64.a libstring_piece.a 

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

# Tests.

noinst_PROGRAMS = jpeg_codec_unittest base64_unittest

jpeg_codec_unittest_SOURCES = jpeg_codec_unittest.cc
jpeg_codec_unittest_LDADD = -lgtest libjpeg_codec.a

base64_unittest_SOURCES = base64_unittest.cc
base64_unittest_LDADD = -lgtest_main -lgtest libbase64.a libmodp_b64.a

TESTS = jpeg_codec_unittest base64_unittest
