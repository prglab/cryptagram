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

#print discretize(35, 235, 3)

class BaseN(object):
  def __init__(self, base, num_units):
    self.base = base
    self.num_units = num_units

  def encode(self, int_val):
    if int_val not in range(self.base ** self.num_units):
      return None

    # TODO(tierney): Memoized version.

    ret_vals = []
    accum = 0
    for i in range(self.num_units-1, -1, -1):
      _ = int((int_val - accum) / (1. * (self.base ** i)))
      accum += (_ * (self.base ** i))
      ret_vals.append(_)
    return ret_vals

  def decode(self, shape_vals):
    if type(shape_vals) != list or len(shape_vals) != self.num_units:
      return None

    # TODO(tierney): Memoized version.

    ret_val = 0
    shape_vals.reverse() # Descending to ascending.
    for i, val in enumerate(shape_vals):
      ret_val += val * (self.base ** i)
    return ret_val


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


def main():
  # Data shape.
  shape = [[1, 2],
           [1, 2]]

  b = Block(shape)
  b.analyze()

  DISCRETIZING_UNITS = 4
  NUM_BASE_UNITS = b.get_num_blocks()

  base4 = BaseN(DISCRETIZING_UNITS, NUM_BASE_UNITS)
  enc = base4.encode(13)
  print enc
  print base4.decode(enc)

  channel_ranges = {
    'Y'  : [35, 235, DISCRETIZING_UNITS + 1],
    'Cb' : [35, 235, 4],
    'Cr' : [35, 235, 4]
    }

  channel_ranges = {
    'Y'  : ([35, 235, DISCRETIZING_UNITS + 1], base4.encode),
    'Cb' : [35, 235, 4],
    'Cr' : [35, 235, 4]
    }

  return

  for cr in channel_ranges:
    ret, rev_ret = discretize(*channel_ranges.get(cr))
    print cr
    for r in sorted(ret):
      print '  %3s : %3d' % (r, ret.get(r))
    print
    for r in sorted(rev_ret, reverse=True):
      print '  %3d : %3s' % (r, rev_ret.get(r))


main()


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
