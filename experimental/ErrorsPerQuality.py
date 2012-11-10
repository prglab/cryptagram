#!/usr/bin/env python

import sys
import numpy as np
from random import choice
import dct

# def find_nearest(array,value):
#   idx=(np.abs(array-value)).argmin()
#   return array[idx]

# array=np.random.random(10)
# print(array)
# # [ 0.21069679  0.61290182  0.63425412  0.84635244  0.91599191  0.00213826
# #   0.17104965  0.56874386  0.57319379  0.28719469]

# value=0.5

# print(find_nearest(array,value))


# Embed the values in the color space, discretized by the coordinates provided
# from the kmeans experiment (or the aesthete protocol).
def Encode(discretizations):
  # Depending on encoding efficiency length we will embed a certain number of values.

  # Generate message for 16 x 16 using 2x2 blocks for symbols.
  array = np.zeros((16,16))
  for i in range(64):
    row = i / 8
    col = i % 8
    red, green, blue = choice(discretizations)
    print row, col, red, green, blue

# Run the jpeg algorithm.

# Count different discretizations and how big the error is.

# Measure average error.

def main(argv):
  Encode([(30,40,50),(6,7,8),(1,2,3)])

if __name__=='__main__':
  main(sys.argv)
