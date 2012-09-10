CXX=clang++
CXXFLAGS=-Wall -g

main: colorspace.o
	$(CXX) $(CXXFLAGS) -o main main.cc ColorSpace.o

colorspace.o:
	$(CXX) $(CXXFLAGS) -c ColorSpace.cc

clean:
	rm -f *.o main *.pyc