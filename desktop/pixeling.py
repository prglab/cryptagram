#!/usr/bin/env python
import logging
import numpy

class Pixeling(object):
  def __init__(self, width, height):
    self.width = width
    self.height = height
    logging.info('Pixeling dimensions (w x h): %d x %d.' % (width, height))
    self.array = numpy.zeros([width, height])

  def fill_rectangle(self, coordinate_list):
    # Expects [(x0,y0),(x1,y1)]
    [(x0,y0),(x1,y1)] = coordinate_list
    logging.debug('Coordinate list: %s.' % str(coordinate_list))
    for x_coord in range(x0, x1):
      for y_coord in range(y0, y1):
        self.array[x_coord, y_coord] += 1

  def get_filled_coords():
    return self.array.nonzeros()

  def get_unfilled_coords():
    # Sanity check the values of the array.
    array_max = self.array.max()
    logging.info('Maximum value in array: %d.' % array_max)
    assert(array_max == 1)

    # "Additively invert" the values so we can call nonzeroes to determine which
    # coordinates were not filled.
    empty_coords = self.array - numpy.ones(height, width)
    return self.array.nonzeros()
