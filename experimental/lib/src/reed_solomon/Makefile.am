noinst_PROGRAMS = rs_main

rs_main_SOURCES = rs_main.cc
rs_main_CXX = g++
rs_main_LDADD =  -lm  -lpthread librs.a

noinst_LIBRARIES = librs.a
librs_a_SOURCES = reed_solomon.c list.h rslib.h
librs_a_CPPFLAGS = -Wall
