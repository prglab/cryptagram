#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.68])
AC_INIT([Cryptogram], [1.0], [tierney@cs.nyu.edu])
AM_INIT_AUTOMAKE
AM_SILENT_RULES([no])
AC_CONFIG_SRCDIR([src/main.cc])
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
                 src/base/Makefile
                 ])

AC_CONFIG_FILES([scripts/gtest-config], [chmod +x scripts/gtest-config])
AC_OUTPUT
