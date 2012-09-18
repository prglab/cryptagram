#!/usr/bin/env python

import random
import sys
import threading

#from scikits.statsmodels.tsa.stattools import acf
import Bits
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

def Downsample(matrix):
  # Include smoothing.
  pass

def Upsample(matrix):
  pass

def CreateRandomMatrix(seeds):
  matrix = numpy.ndarray((8,8))
  for row in range(8):
    for col in range(8):
      matrix[row][col] = random.choice(seeds)
  return matrix

def PickTwoDistanceMedian():
  pass


class Discretizations(object):
  values = []

class Experiment(object):
  discretizations = []

  def __init__(self):
    pass


def main(argv):
  print "Generating messages"
  num_matrices = 100000

  random_matrices = [CreateRandomMatrix([32, 32 + 64, 32 + 128, 32 + 128 + 64])
                     for i in range(num_matrices)]

  with open('matrices.log', 'w') as fh:
    for i in range(num_matrices):
      print >>fh, '%d ' * 64 % tuple(random_matrices[i].flatten())

  experiments = []
  for quality in range(50, 99, 2):
    experiments.append(Experiment(quality, random_matrices))

  print "Starting experiments."
  [experiment.start() for experiment in experiments]
  print "Joining experiments."
  [experiment.join() for experiment in experiments]


class Experiment(threading.Thread):
  def __init__(self, quality, random_matrices):
    self.quality = quality
    self.random_matrices = random_matrices
    threading.Thread.__init__(self)

  def run(self):
    quant_table = QuantizationTableFromQuality(LuminanceQuantizationTable,
                                               self.quality)

    with open('quad_pix_%d.log' % self.quality,'w') as fh:
      for i in range(len(self.random_matrices)):

        jpeg = JpegCompress(self.random_matrices[i], quant_table)
        decompressed = JpegDecompress(jpeg, quant_table)

        mismatch_table = numpy.absolute(
          decompressed - self.random_matrices[i]) < 32
        num_mismatches, num_matches = numpy.bincount(mismatch_table.flatten())

        print >>fh, num_mismatches

if __name__=='__main__':
  main(sys.argv)
