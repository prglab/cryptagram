# Binaries.

bin_PROGRAMS = cryptogram_main
cryptogram_main_SOURCES = main.cc discretizations.h experiment.h util.h
cryptogram_main_LDADD = libjpeg_delta.a libjpeg_codec.a

# Libraries.

noinst_LIBRARIES = libjpeg_delta.a libjpeg_codec.a libCoder.a
libjpeg_delta_a_SOURCES = jpeg_delta.cc jpeg_delta.h basictypes.h

libjpeg_codec_a_SOURCES = jpeg_codec.cc jpeg_codec.h

libCoder_a_SOURCES = Coder.h

# Tests.

noinst_PROGRAMS = jpeg_codec_unittest
jpeg_codec_unittest_SOURCES = jpeg_codec_unittest.cc
jpeg_codec_unittest_LDADD = -lgtest libjpeg_codec.a

TESTS = jpeg_codec_unittest
