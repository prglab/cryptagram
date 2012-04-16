#!/usr/bin/env python

# TODO(tierney): Last row repair. Instead of writing black, we probably want to
# write an average of the preceeding rows in the block of 8 (due to the JPEG
# DCT). Of course, we must find a way to reengineer this application. Notably,
# the last row will be unrecoverable especially if resizing is involved.

import numpy
from SymbolShape import SymbolShape
from Codec import Codec
from PIL import Image
from ImageCoder import Base64MessageSymbolCoder, Base64SymbolSignalCoder

import random
def randb64s(n):
  values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  return [values[i] for i in map(random.randrange,[0]*n,[63]*n)]

ss = SymbolShape([[1, 1, 1, 1, 2, 2, 2, 2],
                  [1, 1, 1, 1, 2, 2, 2, 2]])
codec = Codec(ss, 1.33, Base64MessageSymbolCoder(), Base64SymbolSignalCoder())
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
