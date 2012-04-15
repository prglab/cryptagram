#!/usr/bin/env python

# Last row repair. Instead of writing black, we probably want to write an
# average of the preceeding rows in the block of 8 (due to the JPEG DCT). Of
# course, we must find a way to reengineer this application. Notably, the last
# row will be unrecoverable especially if resizing is involved.

import math
import numpy
from math import ceil
from SymbolShape import SymbolShape
from PIL import Image

class NewImageDimensions(object):
  # Instantiate object. Expected to have set hw_ratio
  symbol_height = None
  symbol_width = None
  _epsilon = .1

  def __init__(self, hw_ratio, data_len, symbol_shape):
    self.hw_ratio = hw_ratio
    self.data_len = data_len
    self.symbol_shape = symbol_shape

  def _round_up(self, val):
    return int(ceil(val))
  def _round_down(self, val):
    return int(val)

  def _calculate_symbol_dims(self):
    # xw = sqrt( ((r +- e)*bh*s) / bw )
    # xh = S / xw

    # Plus calculations.
    num_symbols_wide = (((self.hw_ratio + self._epsilon) * \
                   self.symbol_height * self.data_len) \
                  / (self.symbol_width)) ** .5
    num_symbols_high = self.data_len / float(num_symbols_wide)

    plus_sym_width = self._round_up(num_symbols_wide)
    plus_sym_height = self._round_up(num_symbols_high)

    # Minus calculations
    num_symbols_wide = (((self.hw_ratio - self._epsilon) * \
                   self.symbol_height * self.data_len) \
                  / (self.symbol_width)) ** .5
    num_symbols_high = self.data_len / float(num_symbols_wide)

    minus_sym_width = self._round_up(num_symbols_wide)
    minus_sym_height = self._round_up(num_symbols_high)

    plus_diff = plus_sym_width - \
        (plus_sym_height - self.data_len % plus_sym_width)
    minus_diff = minus_sym_width - \
        (minus_sym_height - self.data_len % minus_sym_width)

    min_diff = min(plus_diff, minus_diff)

    sym_width, sym_height = plus_sym_width, plus_sym_height
    if min_diff != plus_diff:
      sym_width, sym_height = minus_sym_width, minus_sym_height

    # If it turns out that we have an extra row due to rounding, remove it.
    if sym_height - (self.data_len / float(sym_width)) >= 1:
      print 'EXTRA ROW REMOVED.'
      sym_height -= 1

    self.num_symbols_wide = sym_width
    self.num_symbols_high = sym_height

  def _calculate_num_symbols(self):
    assert self.hw_ratio > 0
    self._calculate_symbol_dims()

    self.new_width = self.num_symbols_wide * self.symbol_width
    self.new_height = self.num_symbols_high * self.symbol_height

  def _apply_symbol_shape(self):
    self.symbol_width = self.symbol_shape.get_shape_width()
    self.symbol_height = self.symbol_shape.get_shape_height()

  def get_image_dimensions(self):
    self._apply_symbol_shape()
    self._calculate_num_symbols()
    return self.new_width, self.new_height

  def get_image_symbol_dimensions(self):
    self._apply_symbol_shape()
    self._calculate_num_symbols()
    return self.num_symbols_wide, self.num_symbols_high


class Codec(object):
  def __init__(self, symbol_shape, original_hw_ratio, datum_to_symbol, thresholds):
    self.symbol_shape = symbol_shape
    self.original_hw_ratio = original_hw_ratio
    self.datum_to_symbol = datum_to_symbol
    self.thresholds = thresholds

  def encode_base64(self, data):
    # Expect data to be numerical index already for threshold dictionary.

    # TODO(tierney): Expectation on already passed data.
    #data.replace('=','')

    data_len = len(data)
    self.new_image_dimensions = NewImageDimensions(
      self.original_hw_ratio, data_len, self.symbol_shape)

    new_image_width, new_image_height = \
        self.new_image_dimensions.get_image_dimensions()
    new_image_symbol_width, new_image_symbol_height = \
        self.new_image_dimensions.get_image_symbol_dimensions()

    print 'Sym dims:', new_image_symbol_width, new_image_symbol_height

    new_image = Image.new('RGB', (new_image_width, new_image_height))
    print 'New Image dims:',new_image_width, new_image_height
    pixel = new_image.load()

    shape_width, shape_height = self.symbol_shape.get_shape_size()

    for i, datum in enumerate(data):
      y_coord = int(i / float(new_image_symbol_width))
      x_coord = int(i - (y_coord * new_image_symbol_width))
      print ' ', x_coord, y_coord
      symbol_values = self.datum_to_symbol(datum)
      print symbol_values
      assert (len(symbol_values) == self.symbol_shape.get_num_symbol_shapes())

      for sym_i, symbol_val in enumerate(symbol_values):
        fill = self.thresholds[symbol_val]
        coords = self.symbol_shape.get_symbol_shape_coords(sym_i+1)
        for x,y in coords:
          base_x = x_coord * shape_width
          base_y = y_coord * shape_height
          print 'Filling', base_x + x, base_y + y,'with',fill
          pixel[base_x + x, base_y + y] = (fill, fill, fill)

    return new_image

def base64_to_two_shapes(index):
  octal_val = '%02s' % oct(index)[1:]
  return list(octal_val.replace(' ','0'))
thresholds = { # Well, nine (we add one for "black").
  '0': 235,
  '1': 207,
  '2': 179,
  '3': 151,
  '4': 123,
  '5': 95,
  '6': 67,
  '7': 39,
  '8': 11,
  }
ss = SymbolShape([[1, 2, 2],
                  [1, 1, 2]])
codec = Codec(ss, 1.33, base64_to_two_shapes, thresholds)
length = 20
im = codec.encode_base64([int('42')+i for i in range(length)])
im.save('test.jpg',quality=95)
import sys
sys.exit(1)

# Calculate specs.
ni = NewImageDimensions()
ni.data_len = 13
ni.symbol_height = 2
ni.symbol_width = 3

print ni.get_image_dimensions()
width, height = ni.get_image_symbol_dimensions()
print width, height

matrix = numpy.ones((width, height))
values = numpy.zeros((width, height))

# Encode data.
for i in range(ni.data_len):
  y_coord = int(i / float(width))
  x_coord = int(i - (y_coord * width))
  print i, x_coord, y_coord
  matrix[x_coord, y_coord] -= 1

  values[x_coord, y_coord] = i

last_x_coord = x_coord
last_y_coord = y_coord
print 'Difference', (width-1) - last_x_coord

# Copy previous rows onto last.
print matrix
nz = matrix.nonzero()
assert len(nz) == 2
for i, entry in enumerate(nz[0]):
  empty_y_row = nz[1][i]
  values[entry, empty_y_row] = values[entry, empty_y_row-1]
  print 'Copy from', entry, empty_y_row-1, 'to', entry, empty_y_row

print values
