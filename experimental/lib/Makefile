CXX=clang++
CXXFLAGS=-Wall -O2 \
	-I/usr/local/include/skia/include/config \
	-I/usr/local/include/glog \
	-I/usr/local/opt/jpeg-turbo/include
CXXLIBS=-L/usr/local/opt/jpeg-turbo/lib -L/usr/local/lib -ljpeg -lglog -lpthread

objects = main.o experiment.o discretizations.o jpeg_codec.o jpeg_file.o

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
