#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.68])
AC_INIT([Cryptogram], [1.0], [tierney@cs.nyu.edu])
AC_CONFIG_AUX_DIR([build-aux])
AM_INIT_AUTOMAKE

AC_CANONICAL_HOST

AM_SILENT_RULES([yes])

AC_CONFIG_SRCDIR([src/jpeg_codec.cc])
AC_CONFIG_HEADERS([config.h])
AC_CONFIG_MACRO_DIR([m4])
LT_PREREQ([2.2])
LT_INIT([dlopen])

# Checks for programs.
AC_PROG_CC([clang])
AC_PROG_CXX([clang++])
AC_PROG_INSTALL
AC_PROG_LIBTOOL
AM_PROG_CC_C_O
AC_PROG_GREP
AC_PROG_EGREP
AC_PROG_CXX

dnl First look for Boost, maybe for a specific minimum version:
BOOST_REQUIRE([1.34])

dnl Then look for specific Boost libraries you need:
dnl BOOST_ARRAY
dnl BOOST_DATE_TIME

AC_DEFINE(CONFIG_REED_SOLOMON_ENC8, 1, Reed Solomon encoding word length)
AC_DEFINE(CONFIG_REED_SOLOMON_DEC8, 1, Reed Solomon decoding word length)

# TODO(chandlerc@google.com): Currently we aren't running the Python tests
# against the interpreter detected by AM_PATH_PYTHON, and so we condition
# HAVE_PYTHON by requiring "python" to be in the PATH, and that interpreter's
# version to be >= 2.3. This will allow the scripts to use a "/usr/bin/env"
# hashbang.
PYTHON=  # We *do not* allow the user to specify a python interpreter
AC_PATH_PROG([PYTHON],[python],[:])
AS_IF([test "$PYTHON" != ":"],
      [AM_PYTHON_CHECK_VERSION([$PYTHON],[2.3],[:],[PYTHON=":"])])
AM_CONDITIONAL([HAVE_PYTHON],[test "$PYTHON" != ":"])

# Configure pthreads.
AC_ARG_WITH([pthreads],
            [AS_HELP_STRING([--with-pthreads],
               [use pthreads (default is yes)])],
            [with_pthreads=$withval],
            [with_pthreads=check])

have_pthreads=no
AS_IF([test "x$with_pthreads" != "xno"],
      [ACX_PTHREAD(
        [],
        [AS_IF([test "x$with_pthreads" != "xcheck"],
               [AC_MSG_FAILURE(
                 [--with-pthreads was specified, but unable to be used])])])
       have_pthreads="$acx_pthread_ok"])
AM_CONDITIONAL([HAVE_PTHREADS],[test "x$have_pthreads" == "xyes"])
AC_SUBST(PTHREAD_CFLAGS)
AC_SUBST(PTHREAD_LIBS)

# Checks for libraries.
AC_CHECK_LIB([glog], [_ZN6google17InitGoogleLoggingEPKc], ,
  AC_MSG_WARN([

Make sure you link to google's logging library.

]))

AC_CHECK_LIB([jpeg], [jpeg_finish_compress], ,
  AC_MSG_WARN([

Make sure you link to libjpeg.

]))

dnl libtcmalloc

AC_ARG_WITH([tcmalloc],
  [AS_HELP_STRING([--without-tcmalloc],
    [disable support for tcmalloc])],
  [],
  [with_tcmalloc=yes])

AS_IF([test "x$with_tcmalloc" != xno],
  [AC_CHECK_LIB([tcmalloc], [tc_malloc],
    [AC_SUBST([LIBTCMALLOC], ["-ltcmalloc"])
     AC_DEFINE([HAVE_LIBTCMALLOC], [1],
               [Define if you have libtcmalloc])
    ],
    [AC_MSG_FAILURE(
       [tcmalloc test failed (--without-tcmalloc to disable)])],
    [])])
AM_CONDITIONAL(USE_LIBTCMALLOC, test "x$with_tcmalloc" == "xyes")

dnl Boost specific suffices.
dnl AS_IF([test -z "${BOOST_LIB_SUFFIX+x}"], [BOOST_LIB_SUFFIX=-mt])
dnl AC_ARG_VAR([BOOST_LIB_SUFFIX], [Boost library name suffix [default=-mt]])

BOOST_SYSTEM

dnl AC_CHECK_LIB([gtest], [_ZN7testing14InitGoogleTestEPiPPc], ,
dnl   AC_MSG_WARN([

dnl Missing gtest library. (TODO(tierney): Figure out a correct function name.)
dnl ]))

dnl AC_CHECK_LIB([gtest_main], [main], ,
dnl   AC_MSG_ERROR([
dnl Missing gtest_main.
dnl Fetch from: http://code.google.com/p/googletest
dnl ]))

# Checks for header files.
AC_CHECK_HEADERS([limits.h ltdl.h stddef.h stdint.h string.h jpeglib.h])

AC_SEARCH_LIBS([lt_dlopen], [ltdl])

# Checks for typedefs, structures, and compiler characteristics.
AC_HEADER_STDBOOL
AC_C_INLINE
AC_TYPE_SIZE_T
AC_TYPE_UINT32_T
AC_TYPE_UINT8_T
AC_CHECK_TYPES([ptrdiff_t])

# Checks for library functions.
AC_CHECK_FUNCS([bzero memmove])

AC_CONFIG_FILES([Makefile
                 src/Makefile
                 src/cryptopp/Makefile
                 src/reed_solomon/Makefile
                 ])

AC_CONFIG_FILES([scripts/gtest-config], [chmod +x scripts/gtest-config])
AC_OUTPUT
