CXX=clang++
GTEST_ROOT=/home/tierney/repos/googletest-read-only

all:
	$(CXX) -c cryptogram.cc

test:
	$(CXX) -o cryptogram_test cryptogram_test.cc -I$(GTEST_ROOT)/include -L$(GTEST_ROOT)/build -lgtest -lpthread -Wall

clean:
	rm -f *.o