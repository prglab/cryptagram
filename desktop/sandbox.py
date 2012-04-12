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
main()

# Data shape.
shape = [[1, 0, 0],
         [1, 1, 0]]

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
