#!/usr/bin/env python
import math
def discretize(low, high, num_units, reverse=True, hex_key=True):
  ret = {}
  separation = int(math.ceil((high - low) / (1. * (num_units-1))))
  to_enumerate = range(high, low-separation, -separation) if reverse \
      else range(low, high+separation, separation)

  for i, value in enumerate(to_enumerate):
    key = i
    if hex_key:
      key = hex(i).replace('0x','')
    ret[key] = value

  reverse_ret = dict((v,k) for k, v in ret.iteritems())

  return ret, reverse_ret

def main():
  channel_ranges = {'Y'  : [35, 235, 9],
                    'Cb' : [35, 235, 4],
                    'Cr' : [35, 235, 4]
                    }
  for cr in channel_ranges:
    print cr, discretize(*channel_ranges.get(cr))

#print discretize(35, 235, 3)
#main()

class BaseN(object):
  def __init__(self, base, data_range, num_blocks):
    self.base = base
    self.data_range = data_range
    self.num_blocks = num_blocks

  def encode(self, int_val):
    if int_val not in self.data_range: return None
    ret_vals = []
    accum = 0
    for i in range(self.num_blocks-1, -1, -1):
      _ = int((int_val - accum) / (1. * (self.base ** i)))
      accum += (_ * (self.base ** i))
      ret_vals.append(_)
    print ret_vals

  def decode(self):
    pass

b = BaseN(8, range(64), 3)
b.encode(63)

b = BaseN(10, range(2 ** 16), 3)
b.encode(63)


def foo(base, base_range, num_blocks):
  # base in [16, 64]
  pass


class Block(object):
  _analyzed = False
  _index_map = {}

  def __init__(self, shape):
    self.shape = shape

  def get_num_blocks(self):
    # Count the number of distinct blocks, ignoring zero-valued blocks.
    self.analyze()
    shapes = self._index_map.keys()
    # Remove zero if we have blocks that were entered as such.
    if 0 in shapes:
      shapes.remove(0)
    return len(shapes)

  def get_all_blocks(self):
    self.analyze()
    return self._index_map

  def get_block_coords(self, index):
    self.analyze()
    return self._index_map.get(index)

  def analyze(self):
    if not self._analyzed:
      self._analyze()
      self._analyzed = True
    return self._analyzed

  def _analyze(self):
    for y, row in enumerate(self.shape):
      for x, index in enumerate(row):
        if index not in self._index_map:
          self._index_map[index] = []
        self._index_map[index].append((x,y))
    print str(self._index_map)

# Data shape.
shape = [[1, 2],
         [1, 2]]

b = Block(shape)
b.analyze()
print b.get_num_blocks()
print b.get_block_coords(1)


def datum_to_block_vals(datum, datum_type):
  if 'b64' == datum_type:
    index = base64chars.find(b64_datum)
    if index < 0:
      self.nonb64count += 1
      return

    octal_val = '%02s' % (oct(index)[1:])
    base4_0, base4_1 = list(octal_val.replace(' ','0'))
    return base4_0, base4_1

  elif 'hex' == datum_type:
    hex_val = int(hex_datum, 16)
    base4_1 = int(hex_val / 4.0)
    base4_0 = int(hex_val - (base4_1 * 4))
    return base4_0, base4_1


def rectangles(datum, num_blocks):
  pass
