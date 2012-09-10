#!/usr/bin/env python

import sys
import util

from numpy import array
from scipy.cluster.vq import kmeans

class ColorSpace(object):
  @staticmethod
  def ColorSamples():
    return range(0, 256, 4)

  @staticmethod
  def IsValidColor(color_value):
    return (color_value >= 0) and (color_value <= 255)

  @staticmethod
  def RGBtoYCC(red, green, blue):
    lum = 0.299 * red + 0.587 * green + 0.114 * blue
    cb = 128 - 0.168736 * red - 0.331264 * green + 0.5 * blue
    cr = 128 + 0.5 * red - 0.418688 * green - 0.081312 * blue
    return [lum, cb, cr]

  @staticmethod
  def YCCtoRGB(lum, cb, cr):
    red = lum + 1.402 * (cr - 128)
    green = lum - 0.34414 * (cb - 128) - 0.71414 * (cr - 128)
    blue = lum + 1.772 * (cb - 128)
    return [red, green, blue]

  @staticmethod
  def GenerateObservations(valid_observations):
    if (valid_observations != []):
      return False

    for red in ColorSpace.ColorSamples():
      for green in ColorSpace.ColorSamples():
        for blue in ColorSpace.ColorSamples():
          valid_observations.append(ColorSpace.RGBtoYCC(red, green, blue))

    return util.InflateObservations(valid_observations)


class KmeansExperiment(object):
  # Maps the image to the "error set," which is information about the
  # errors, if any, there were detected given the parameters of the
  # Kmeans experiment.
  image_errors = {}

  # Given (Weights, b bins, I image set, k means computation, q_t
  # quality threshold)
  def __init__(self, weights, bins, images, quality):
    self.weights = weights
    self.bins = bins
    self.images = images
    self.quality = quality


def GenerateCoordinates(bins):
  observations = []
  ColorSpace.GenerateObservations(observations)

  print "Starting with ", bins
  codebook, distortion = kmeans(array(observations), bins)
  print "  Done with ", bins
  observations = list(codebook)
  util.DeflateObservations(observations)
  with open("Bins_%02d.txt" % bins, 'w') as fh:
    for obs in observations:
      print >>fh, "%d,%d,%d" % [int(x) for x in ColorSpace.YCCtoRGB(*obs)]

def main(argv):
  from multiprocessing import Pool
  p = Pool(5)
  p.map(GenerateCoordinates, range(16, 33))

if __name__=='__main__':
  main(sys.argv)
