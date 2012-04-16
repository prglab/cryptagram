#!/usr/bin/env python

# TODO(tierney): Last row repair. Instead of writing black, we probably want to
# write an average of the preceeding rows in the block of 8 (due to the JPEG
# DCT). Of course, we must find a way to reengineer this application. Notably,
# the last row will be unrecoverable especially if resizing is involved.

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
    row_discrepancy = sym_height - self._round_up(self.data_len / float(sym_width))
    sym_height -= row_discrepancy

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
  def __init__(self, symbol_shape, original_hw_ratio, encoding_shape_translator,
               symbol_fill_translator):
    self.symbol_shape = symbol_shape
    self.original_hw_ratio = original_hw_ratio
    self.encoding_shape_translator = encoding_shape_translator
    self.symbol_fill_translator = symbol_fill_translator

  def encode(self, data):
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
      # print ' ', x_coord, y_coord
      symbol_values = self.encoding_shape_translator.encoding_to_shapes(datum)
      # print symbol_values
      assert (len(symbol_values) == self.symbol_shape.get_num_symbol_shapes())

      base_x = x_coord * shape_width
      base_y = y_coord * shape_height

      for sym_i, symbol_val in enumerate(symbol_values):
        fill = self.symbol_fill_translator.symbol_to_fill(symbol_val)
        coords = self.symbol_shape.get_symbol_shape_coords(sym_i + 1)
        for x,y in coords:
          pixel[base_x + x, base_y + y] = (fill, fill, fill)

    return new_image


  def decode(self, read_image):
    width, height = read_image.size
    image = read_image.convert('RGB') # Ensure format is correct.

    shape_width, shape_height = self.symbol_shape.get_shape_size()
    pixels = image.load()
    extracted_data = ''
    for y_coord in range(0, height, shape_height):
      for x_coord in range(0, width, shape_width):
        values = {}
        for symbol_val in range(self.symbol_shape.get_num_symbol_shapes()):
          coords = self.symbol_shape.get_symbol_shape_coords(symbol_val+1)
          values[symbol_val] = {}
          for x,y in coords:
            values[symbol_val][(x,y)] = pixels[x_coord + x, y_coord + y]

        extracted_datum = self.encoding_shape_translator.shapes_to_encoding(
          self.symbol_fill_translator.fill_to_symbol(values))
        extracted_data += extracted_datum
    return extracted_data

from util import bsearch, average

class SymbolFillTranslator(object):
  thresholds = {}
  def symbol_to_fill(self, symbol_val):
    pass
  def fill_to_symbol(self, values):
    pass

class Base64SymbolFillTranslator(SymbolFillTranslator):
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

  _inv_thresholds = dict((v,k) for k, v in thresholds.iteritems())

  def symbol_to_fill(self, symbol_val):
    return self.thresholds[symbol_val]

  def fill_to_symbol(self, values):
    ret = []
    for sym_i in values:
      sym_values = values.get(sym_i)
      avg_value = average([average(sym_values.get(coord))
                           for coord in sym_values])
      keys = sorted(self._inv_thresholds.keys())
      ret.append(int(self._inv_thresholds[keys[bsearch(keys, avg_value)]]))
    return ret

class EncodingShapeTranslator(object):
  encoding = None

  def encoding_to_shapes(self, index):
    pass
  def shapes_to_encoding(self, values):
    pass

class Base64Translator(EncodingShapeTranslator):
  encoding = 'base64'
  values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

  def encoding_to_shapes(self, char):
    index = self.values.find(char)
    octal_val = '%02s' % oct(index)[1:]
    return list(octal_val.replace(' ','0'))

  def shapes_to_encoding(self, values):
    assert len(values) == 2
    if values[0] == 8 or values[1] == 8:
      return ''
    index = int('%d%d' % (values[0], values[1]), 8)
    return self.values[index]

import random
def randb64s(n):
  values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  return [values[i] for i in map(random.randrange,[0]*n,[63]*n)]

ss = SymbolShape([[1, 1, 1, 1, 2, 2, 2, 2],
                  [1, 1, 1, 1, 2, 2, 2, 2]])
codec = Codec(ss, 1.33, Base64Translator(), Base64SymbolFillTranslator())
length = 190000
print length
quality = 50
data = randb64s(length)
#print ''.join(data)
im = codec.encode(data)
im.save('test.jpg',quality=quality)
with open('test.jpg') as fh:
  fh.read()
  print fh.tell(), fh.tell() / float(length)

read_back_image = Image.open('test.jpg')
extracted_data = codec.decode(read_back_image)
errors = 0
for i, datum in enumerate(data[:min(len(data), len(extracted_data))]):
  if datum != extracted_data[i]:
    errors += 1
print 'Errors:', errors
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
