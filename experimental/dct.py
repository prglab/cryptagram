#!/usr/bin/env python

from PIL import Image
import random
import sys
import threading

#from scikits.statsmodels.tsa.stattools import acf
import Bits
from scipy.fftpack import dct
import numpy

import matplotlib
# Calling matplotlib.use() before import pyplot frees us from requiring a
# $DISPLAY environment variable; i.e, makes it easier to script this process.
# TODO(tierney): This image backend should be made more portable.
import matplotlib.pyplot as plt


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


def ScaleFactorEntry(entry, scale_factor):
  return ((1. * entry * scale_factor) + 50.) / 100.

def QuantizationTableFromQuality(table, quality, force_baseline = False):
  scale_factor = JpegQualityScaling(quality)

  new_table = numpy.zeros((8,8))
  row_index = -1
  for row in table:
    row_index += 1
    entry_index = -1
    for entry in row:
      entry_index += 1

      temp = ScaleFactorEntry(entry, scale_factor)
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

def CreateAestheteRandomMatrix(seeds):
  matrix = numpy.ndarray((8,8))
  for row in range(0, 8, 2):
    for col in range(0, 8, 2):
      chosen_ = random.choice(seeds)
      matrix[row][col] = chosen_
      matrix[row + 1][col] = chosen_
      matrix[row][col + 1] = chosen_
      matrix[row + 1][col + 1] = chosen_
  return matrix

def Shift(matrix):
  vshift = numpy.row_stack((matrix[1:8,:],matrix[0,:]))
  hshift = numpy.column_stack((vshift[:,1:8],vshift[:,0]))
  return hshift

def Unshift(matrix):
  hshift = numpy.column_stack((matrix[:,7],matrix[:,0:7]))
  vshift = numpy.row_stack((hshift[7,:],hshift[0:7,:]))
  return vshift

def CreateMatrixFromValue(value):
  return numpy.multiply(value, numpy.ones((8,8)))

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

  # orig_quality = 95
  # quant_table = QuantizationTableFromQuality(LuminanceQuantizationTable,
  #                                            orig_quality)

  # coeff = (1. * orig_quality)
  # SmallDiskImage = numpy.array([
  #   [coeff, 0, 0, 0, 0, 0, 0, 0],
  #   [0, 0, 0, 0, 0, 0, 0, 0],
  #   [0, 0, 0, 0, 0, 0, 0, 0],
  #   [0, 0, 0, 0, 0, 0, 0, 0],
  #   [0, 0, 0, 0, 0, 0, 0, 0],
  #   [0, 0, 0, 0, 0, 0, 0, 0],
  #   [0, 0, 0, 0, 0, 0, 0, 0],
  #   [0, 0, 0, 0, 0, 0, 0, 0]])

  # SmallDiskImage[4][4] = coeff / (1. * quant_table[4][4] / (1. * quant_table[0][0]))

  # print "SmallDiskImage"
  # print SmallDiskImage

  # print "Quant table at quality"
  # print quant_table
  # matrix = SmallDiskImage
  # print "Intermediate Matrix (to be IDCT'd)"
  # print numpy.multiply(matrix, quant_table)
  # decompressed = JpegDecompress(matrix, quant_table)
  # print "Luminance Decompressed"
  # print decompressed

  # new_quant_table = QuantizationTableFromQuality(LuminanceQuantizationTable,
  #                                                50)

  # print "Recompressed on disk"
  # print JpegCompress(decompressed, new_quant_table).astype(int)

  # fig = plt.figure()
  # ax = fig.add_subplot(111)
  # cax = ax.imshow(decompressed, interpolation='nearest', origin='lower') # This could also be upper.
  # cbar = fig.colorbar(cax)

  # plt.xlabel("X")
  # plt.ylabel("Y")

  # plt.show()


  # These are the discrete values written in luminance.
  discrete_values = [
    238,
    210,
    182,
    154,
    126,
    98,
    70,
    42,
    14]

  random_matrices = [CreateAestheteRandomMatrix(discrete_values)
                     for i in range(num_matrices)]

  with open('matrices.log', 'w') as fh:
    for i in range(num_matrices):
      if i % 1000 == 0:
        print "  ", i
      print >>fh, '%d ' * 64 % tuple(random_matrices[i].flatten())

  experiments = []
  for quality in range(68, 80, 4):
    experiments.append(Experiment(quality, random_matrices))

  print "Starting experiments."
  [experiment.start() for experiment in experiments]
  print "Joining experiments."
  [experiment.join() for experiment in experiments]

def Flatten(matrix):
  ret = numpy.zeros((8,8))
  for i in range(0, 8):
    for j in range(0, 8):
      ret[i,j] = matrix[i,j][0]
  return ret

def AverageAestheteBlocksFlat(matrix):
  ret = numpy.zeros((4,4))
  for i in range(0, 8, 2):
    for j in range(0, 8, 2):
      temp = (matrix[i,j] + matrix[i+1, j] + matrix[i, j+1] +
              matrix[i+1, j+1]) / 4.
      ret[i/2,j/2] += temp
  return ret

def AverageAestheteBlocks(matrix,channel):
  ret = numpy.zeros((4,4))
  for i in range(0, 8, 2):
    for j in range(0, 8, 2):
      # Channel: 0=red, 1=green, 2=blue
      temp = (matrix[i,j][channel] + matrix[i+1,j][channel] + matrix[i,j+1][channel] +
              matrix[i+1,j+1][channel]) / 4.
      ret[i/2,j/2] += temp
  return ret

def AverageAestheteBlocksLuminance(matrix):
  ret = numpy.zeros((4,4))
  for i in range(0, 8, 2):
    for j in range(0, 8, 2):
      r = (matrix[i,j][0] + matrix[i+1,j][0] + matrix[i,j+1][0] +
              matrix[i+1,j+1][0]) / 4.
      g = (matrix[i,j][1] + matrix[i+1,j][1] + matrix[i,j+1][1] +
              matrix[i+1,j+1][1]) / 4.
      b = (matrix[i,j][2] + matrix[i+1,j][2] + matrix[i,j+1][2] +
              matrix[i+1,j+1][2]) / 4.
      lum = (0.299 * r) + (0.587 * g) + (0.114 * b)
      ret[i/2,j/2] += lum
  return ret

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

        new_image = Image.new('RGB', (8, 8))
        pixel = new_image.load()
        for j in range(8):
          for k in range(8):
            lum = self.random_matrices[i][j,k]

            tint = 20
            r = lum + tint
            g = lum
            b = lum
            #b = lum - tint * (0.299 / 0.114)

            pixel[j,k] = tuple(map(int, [r, g, b]))

        import cStringIO
        new_file = cStringIO.StringIO()
        new_image.save(new_file, 'jpeg', quality=self.quality)
        new_file.seek(0)
        decompressed = Image.open(new_file)

        decompressed_pixel = decompressed.load()
        # decompressed_averaged_ = AverageAestheteBlocksLuminance(decompressed_pixel)
        decompressed_averaged_ = AverageAestheteBlocks(decompressed_pixel, 1)

        # jpeg = JpegCompress(self.random_matrices[i], quant_table)
        # decompressed = JpegDecompress(jpeg, quant_table)

        # TODO(tierney): This computation of the diff ought to be the average of
        # the values in the 2x2 blocks.
        orig_averaged_ = AverageAestheteBlocksFlat(self.random_matrices[i])
        # decompressed_averaged_ = AverageAestheteBlocks(decompressed)

        mismatch_table = numpy.absolute(
          decompressed_averaged_ - orig_averaged_) < 14
        try:
          num_mismatches, num_matches = numpy.bincount(mismatch_table.flatten())
          if num_mismatches > 0:
            base = "debug/" + str(self.quality) + "_" + str(i) + "_"
            #im_in = decompressed.resize((256,256),'NEAREST')

            decompressed = decompressed.resize((256,256), Image.NEAREST)
            for xx in range(0,4):
              for yy in range(0,4):
                if (mismatch_table[xx,yy] == False):
                  xb = xx * 64 + 24
                  yb = yy * 64 + 24
                  decompressed.paste((255,0,0),(xb,yb,xb+16,yb+16))
            decompressed.save(base + "out.png")

            new_image = new_image.resize((256,256), Image.NEAREST)
            new_image.save(base + "in.png")

        except ValueError:
          print mismatch_table, self.quality
          return

        print >>fh, num_mismatches

if __name__=='__main__':
  main(sys.argv)

  # print QuantizationTableFromQuality(LuminanceQuantizationTable, 76)
  # print numpy.divide(8000, QuantizationTableFromQuality(LuminanceQuantizationTable, 70))

  # for i in range(-128,128):
  #   matrix = CreateMatrixFromValue(i)
  #   print TwoDDCT(matrix)
