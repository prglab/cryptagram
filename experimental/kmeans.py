#!/usr/bin/env python

import sys
import scipy.cluster.vq as vq # Will use vq.kmeans.
import google.protobuf as protobuf

class ColorSpace(object):

  @staticmethod
  def IsValidColor(color_value):
    return (color_value >= 0) and (color_value <= 255)

  @staticmethod
  def RGBtoYCC(red, green, blue):
    lum = 0.299 * red + 0.587 * green + 0.114 * blue
    cb = 128 - 0.168736 * red - 0.331264 * green + 0.5 * blue
    cr = 128 + 0.5 * red - 0.418688 * green - 0.081312 * blue
    return (lum, cb, cr)

  @staticmethod
  def GenerateObservations(valid_observations):
    if (valid_observations != []):
      return False

    for red in range(0, 256):
      for green in range(0, 256):
        for blue in range(0, 256):
          valid_observations.append(ColorSpace.RGBtoYCC(red, green, blue))
    return True

  def YCCtoRGB():
    pass

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

  def Start(self):
    pass

def main(argv):
  observations = []
  ColorSpace.GenerateObservations(observations)
  print len(observations)

if __name__=='__main__':
  main(sys.argv)
