bin_PROGRAMS = cryptogram_main
cryptogram_main_SOURCES = main.cc discretizations.h experiment.h util.h
cryptogram_main_LDADD = libjpeg_delta.a libjpeg_codec.a

# Locally devised libraries.

noinst_LIBRARIES = libjpeg_delta.a libjpeg_codec.a
libjpeg_delta_a_SOURCES = jpeg_delta.cc jpeg_delta.h basictypes.h
libjpeg_codec_a_SOURCES = jpeg_codec.cc jpeg_codec.h

# Tests written here.

noinst_PROGRAMS = libjpeg_codec_test
libjpeg_codec_test_SOURCES = jpeg_codec_unittest.cc
libjpeg_codec_test_LDADD = -lgtest libjpeg_codec.a

TESTS = libjpeg_codec_test