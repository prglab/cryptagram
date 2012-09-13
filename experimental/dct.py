#!/usr/bin/env python

import sys

from scikits.statsmodels.tsa.stattools import acf
from scipy.fftpack import dct
import numpy

LuminanceQuantizationTable = numpy.array([
  [16, 11, 10, 16, 24, 40, 51, 61],
  [12, 12, 14, 19, 26, 58, 60, 55],
  [14, 13, 16, 24, 40, 57, 69, 56],
  [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77],
  [24, 35, 55, 64, 81, 104, 113, 92],
  [49, 64, 78, 87, 103, 121, 120, 101],
  [72, 92, 95, 98, 112, 100, 103, 99]])

ChrominanceQuantizationTable = numpy.array([
  [17, 18, 24, 47, 99, 99, 99, 99],
  [18, 21, 26, 66, 99, 99, 99, 99],
  [24, 26, 56, 99, 99, 99, 99, 99],
  [47, 66, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99],
  [99, 99, 99, 99, 99, 99, 99, 99]])

def TwoDDCT(matrix):
  from scipy.fftpack import dct
  return dct(dct(matrix, axis=0, norm='ortho'), axis=1, norm='ortho')


def TwoDIDCT(matrix):
  from scipy.fftpack import dct
  return dct(dct(matrix, type=3, axis=0, norm='ortho'), type=3, axis=1, norm='ortho')


def test_TwoDDCTMethods():
  # Tests that TwoDDCT and TwoDIDCT are inverses of each other.
  matrix = numpy.random.random_integers(0, high = 255, size = (8,8)).astype(float)
  assert False not in (numpy.absolute((matrix - TwoDIDCT(TwoDDCT(matrix)))) < 1)


def JpegQualityScaling(quality):
  if (quality <= 0):
    quality = 1
  if (quality > 100):
    quality = 100

  if (quality < 50):
    quality = 5000 / quality
  else:
    quality = 200 - quality*2

  return quality


def QuantizationTableFromQuality(table, quality, force_baseline = False):
  scale_factor = JpegQualityScaling(quality)

  new_table = numpy.zeros((8,8))
  row_index = -1
  for row in table:
    row_index += 1
    entry_index = -1
    for entry in row:
      entry_index += 1

      temp = ((1. * entry * scale_factor) + 50.) / 100.
      if (temp < 0):
        temp = 1.
      if (temp > 32767):
        temp = 32767.
      if (force_baseline and temp > 255):
        temp = 255.
      new_table[row_index][entry_index] = int(temp)
  return new_table


def GenerateRandomPostData(n_trials, filename='RandomMatrixDctAndQuant.txt'):
  with open(filename, 'w') as fh:
    for i in xrange(n_trials):
      print >>fh, ToText(RandomMatrixDctAndQuantize(), True)


def ToText(rand_matrix_dct_quant_output, flatten = True):
  orig, post = rand_matrix_dct_quant_output
  output = '%d ' * 64 % tuple(orig if not flatten else orig.flatten())
  output += '; '
  output += '%d ' * 64 % tuple(post if not flatten else post.flatten())
  return output


def RandomMatrixDctAndQuantize():
  matrix = numpy.random.random_integers(0, high = 255, size = (8,8))
  to_use = numpy.array(matrix).astype(float) - 128

  dct_output = TwoDDCT(to_use)
  quant_table = QuantizationTableFromQuality(LuminanceQuantizationTable, 75)
  quantized_values = numpy.round(numpy.divide(dct_output, quant_table))
  return to_use, quantized_values

def JpegCompress(matrix, quant_table):
  dct_output = TwoDDCT(matrix)
  return numpy.round(numpy.divide(dct_output, quant_table))

def JpegDecompress(matrix, quant_table):
  return TwoDIDCT(numpy.multiply(matrix, quant_table))

def Subsample(matrix):
  width, height = matrix.size
  width / 2
  pass

def Supersample(matrix):
  pass

def main(argv):
  matrix = numpy.array([
    [52.0, 55.0, 61.0, 66.0, 70.0, 61.0, 64.0, 73],
    [63.0, 59.0, 55.0, 90.0, 109.0, 85.0, 69.0, 72],
    [62.0, 59.0, 68.0, 113.0, 144.0, 104.0, 66.0, 73],
    [63.0, 58.0, 71.0, 122.0, 154.0, 106.0, 70.0, 69],
    [67.0, 61.0, 68.0, 104.0, 126.0, 88.0, 68.0, 70],
    [79.0, 65.0, 60.0, 70.0, 77.0, 68.0, 58.0, 75],
    [85.0, 71.0, 64.0, 59.0, 55.0, 61.0, 65.0, 83],
    [87.0, 79.0, 69.0, 68.0, 65.0, 76.0, 78.0, 94]])

  to_use, quant_val = RandomMatrixDctAndQuantize()

  print "Autocorrelation:"
  print acf(to_use.flatten())
  print acf(matrix.flatten())
  return
  # GenerateRandomPostData(1000000000)

  print to_use
  quant_table = QuantizationTableFromQuality(LuminanceQuantizationTable, 75)
  uncompressed = TwoDIDCT(numpy.multiply(quant_val, quant_table))
  print uncompressed
  print uncompressed - to_use
  pass

if __name__=='__main__':
  main(sys.argv)
