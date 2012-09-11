#!/usr/bin/env python

import sys
from numpy import array, transpose
from scipy.fftpack import dct

def main(argv):
  matrix = [
    [52.0, 55.0, 61.0, 66.0, 70.0, 61.0, 64.0, 73],
    [63.0, 59.0, 55.0, 90.0, 109.0, 85.0, 69.0, 72],
    [62.0, 59.0, 68.0, 113.0, 144.0, 104.0, 66.0, 73],
    [63.0, 58.0, 71.0, 122.0, 154.0, 106.0, 70.0, 69],
    [67.0, 61.0, 68.0, 104.0, 126.0, 88.0, 68.0, 70],
    [79.0, 65.0, 60.0, 70.0, 77.0, 68.0, 58.0, 75],
    [85.0, 71.0, 64.0, 59.0, 55.0, 61.0, 65.0, 83],
    [87.0, 79.0, 69.0, 68.0, 65.0, 76.0, 78.0, 94]]

  to_use = array(matrix) - 128
  print to_use
  print dct(dct(to_use, axis=0, norm='ortho'), 
            axis=1, norm='ortho')

if __name__=='__main__':
  main(sys.argv)
