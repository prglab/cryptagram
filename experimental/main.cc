
#include <iostream>
#include <vector>

#include "ColorSpace.h"

int main(int argc, char** argv) {
  std::vector<cryptogram::ColorSpace::YCC> observations;
  cryptogram::ColorSpace cs;
	cs.GenerateObservations(&observations);
	return 0;
}
