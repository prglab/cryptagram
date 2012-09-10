#!/usr/bin/env python

import sys
import scipy.cluster.vq.kmeans as kmeans
import google.protobuf as protobuf

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
  pass

if __name__=='__main__':
  main(sys.argv)
