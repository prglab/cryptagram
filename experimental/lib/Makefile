CXX=clang++
CXXFLAGS=-Wall -g -O0 -I/usr/local/include/skia/include/config -I/usr/local/include/glog
CXXLIBS=-L/usr/local/lib -ljpeg -lglog -lpthread

objects = main.o experiment.o discretizations.o jpeg_codec.o

all: main

main: $(objects)
	$(CXX) $(CXXFLAGS) -o $@ $+ $(CXXLIBS)

%.o:%.c
	$(CXX) $(CXXFLAGS) -c $+

main.o: main.cc
experiment.o: experiment.cc
discretizations.o: discretizations.cc
jpeg_codec.o: jpeg_codec.cc

clean:
	rm -f *.o main