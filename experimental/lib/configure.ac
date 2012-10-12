#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.68])
AC_INIT([Jupiter], [1.0], [jupiter-bugs@example.org])
AM_INIT_AUTOMAKE
AC_CONFIG_SRCDIR([src/main.cc])
AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CXX([clang++])
AC_PROG_CC
AC_PROG_RANLIB
AC_PROG_INSTALL

# Checks for libraries.
AC_CHECK_LIB([glog], [_ZN6google17InitGoogleLoggingEPKc])
AC_CHECK_LIB([jpeg], [jpeg_finish_compress])

# Checks for header files.
AC_CHECK_HEADERS(stddef.h)
AC_CHECK_HEADERS(pthread.h)
AC_CHECK_HEADERS(glog/logging.h)
AC_CHECK_HEADERS(google/gflags.h)
AC_CHECK_HEADERS(jpeglib.h)

# Checks for typedefs, structures, and compiler characteristics.
AC_HEADER_STDBOOL
AC_C_INLINE
AC_TYPE_SIZE_T

# Checks for library functions.
AC_CHECK_FUNCS([bzero])

AC_CONFIG_FILES([Makefile src/Makefile])
AC_OUTPUT
