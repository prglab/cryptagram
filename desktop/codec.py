#!/usr/bin/env python

from PIL import Image,ImageDraw
import math
import random
import binascii
import base64
import itertools
import logging
import sys

logging.basicConfig(stream=sys.stdout,
                    level=logging.INFO,
                    format = '%(asctime)-15s %(levelname)8s %(module)s '\
                      '%(threadName)10s %(thread)16d %(lineno)4d %(message)s')

def randstr(n):
  return ''.join(map(chr, map(random.randrange, [0]*n, [127]*n)))

def square_dimensions(n):
  pass

YCbCr = {
  'WHITE' : (180, 128, 128),
  'YELLOW' : (162, 44, 142),
  'CYAN': (131, 156, 44),
  'GREEN': (112, 72, 58),
  'MAGENTA': (84, 184, 198),
  'RED': (65, 100, 212),
  'BLUE': (35, 212, 114),
  'BLACK': (16, 128, 128),
}

def bsearch(a, x, lo=0, hi=None):
  def pmone(val):
    return [val-1, val, val+1]

  if hi is None:
    hi = len(a)-1

  if x < a[lo]: return lo
  if x > a[hi]: return hi

  while lo < hi:
    mid = (lo+hi)/2
    midval = a[mid]
    if midval < x:
      lo = mid+1
    elif midval > x:
      hi = mid
    else:
      return mid

  distances = dict()
  _ = itertools.chain(*[[y for y in pmone(val) if y in range(len(a))]
                        for val in [lo, mid, hi]])
  for idx in set(_):
    distances[abs(x - a[idx])] = idx
  return distances.get(min(distances.keys()))


def shex(integer):
  assert integer >= 0 and integer <= 15
  return hex(integer).replace('0x','')

def thresh_hack(integer):
  return hex(int(shex(integer), 16) + 1).replace('0x','')

def color_space_transform(triplet, from_rgb=True):
  if from_rgb:
    red, green, blue = triplet
    luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue)
    chroma_blue = 128 - (0.168736 * red) - (0.331264 * green) + (0.5 * blue)
    chroma_red = 128 + (0.5 * red) - (0.418688 * green) - (0.081312 * blue)
    return tuple(map(int, (luminance, chroma_blue, chroma_red)))
  else:
    luminance, chroma_blue, chroma_red = triplet
    red = luminance + 1.402 * (chroma_red - 128)
    green = luminance - 0.34414 * (chroma_blue - 128) - 0.71414 * (chroma_red - 128)
    blue = luminance + 1.772 * (chroma_blue - 128)
    return tuple(map(int, (red, green, blue)))

# for color in YCbCr:
#   print color, color_space_transform(YCbCr.get(color), False)

class JpegEncryptionCodec(object):
  _THRESHOLDS = {
    '4' : 16,
    '3' : 71,
    '2' : 126,
    '1' : 181,
    '0' : 236,
    # '4' : 76,
    # '5' : 91,
    # '6' : 106,
    # '7' : 121,
    # '8' : 136,
    # '9' : 151,
    # 'a' : 166,
    # 'b' : 181,
    # 'c' : 196,
    # 'd' : 211,
    # 'e' : 226,
    # 'f' : 235,
    }

  _INV_THRESHOLDS = dict((v,k) for k, v in _THRESHOLDS.iteritems())

  def __init__(self, block_size):
    self.block_size = block_size

  def _threshold_map(self, index):
    # (Y,Cb,Cr) -> hex.
    # Currently: 2**3 * 2

    pass

  def encode(self, hex_data):
    target_width = int(math.ceil(math.sqrt(len(hex_data))))
    width = int(target_width / (self.block_size * 2.))
    height = int(math.ceil(len(hex_data) / (1. * width)))

    new_image_width = width * self.block_size * 2
    new_image_height = height * self.block_size

    image = Image.new('YCbCr', (new_image_width, new_image_height))
    draw = ImageDraw.Draw(image)
    for i, hex_datum in enumerate(hex_data):
      y_coord = int(i / (1. * width))
      x_coord = int(i - (y_coord * width))

      hex_val = int(hex_datum, 16)

      base4_1 = int(hex_val / 4.0)
      base4_0 = int(hex_val - (base4_1 * 4))
      # logging.info(
      #   'Inputted (%2d, %2d) hex_val base4_0 base4_1 %2d %2d %2d.' % \
      #     (x_coord, y_coord, hex_val, base4_0, base4_1))

      base4_0_x = int(x_coord * self.block_size * 2)
      base4_0_y = int(y_coord * self.block_size)
      base4_0_rectangle = \
          [(base4_0_x, base4_0_y),
           (base4_0_x + self.block_size, base4_0_y + self.block_size)]

      base4_0_fill = self._THRESHOLDS[shex(base4_0)]
      base4_0_value = color_space_transform(
        (base4_0_fill, base4_0_fill, base4_0_fill))
      #print base4_0_rectangle, base4_0_value
      draw.rectangle(base4_0_rectangle, fill=base4_0_value)

      base4_1_x = int((x_coord * self.block_size * 2) + self.block_size)
      base4_1_y = int(y_coord * self.block_size)
      base4_1_rectangle = \
        [(base4_1_x, base4_1_y),
         (base4_1_x + self.block_size, base4_1_y + self.block_size)]

      base4_1_fill = self._THRESHOLDS[shex(base4_1)]
      base4_1_value = color_space_transform(
        (base4_1_fill, base4_1_fill, base4_1_fill))
      #print base4_1_rectangle, base4_1_value
      draw.rectangle(base4_1_rectangle, fill=base4_1_value)
    image.load()
    return image

  def _decode_block(self, block):
    block_data = list(block.getdata())
    # logging.info('Block: %s.' % str(block_data))

    lum, cb, cr = (0.0, 0.0, 0.0)
    count = 0
    for datum in block_data:
      lum += datum[0]
      cb += datum[1]
      cr += datum[2]
      count += 1

    lum /= count
    cb /= count
    cr /= count

    keys = sorted(self._INV_THRESHOLDS.keys())
    ret = int(self._INV_THRESHOLDS.get(keys[bsearch(keys, lum)]))
    logging.debug('Decoded %.2f %s %d ' % (lum, str(keys), ret))
    return ret

  def decode(self, rgb_image):
    # Returns the hex_data.
    width, height = rgb_image.size
    image = rgb_image.convert('YCbCr')
    extracted_hex = ''
    count = 0
    supposed_dones = 0
    for y in range(0, height, self.block_size):
      for x in range(0, width, self.block_size * 2):

        block0 = image.crop(
          (x, y, x + self.block_size, y + self.block_size))
        block1 = image.crop(
          (x + self.block_size, y,
           x + (2 * self.block_size), y + self.block_size))

        base4_0 = self._decode_block(block0)
        base4_1 = self._decode_block(block1)

        if (base4_0 == 0 or base4_1 == 0):
          supposed_dones += 1
          # logging.info('Supposedly done at (%d, %d).' % (x, y))
          if (x == width or y == height):
            logging.info('Actually done at (%d, %d).' % (x, y))
            break

        hex_num = (base4_0 + base4_1 * 4) % 16
        # if hex_num != hex_num % 16:
        # logging.info('Block0 %s' % str(list(block0.getdata())))
        # logging.info('Block1 %s' % str(list(block1.getdata())))
        # logging.info(
        #   'Extracted (%2d, %2d) hex_num base4_0 base4_1 %2d %2d %2d' % \
        #     (x, y, hex_num, base4_0, base4_1))

        hex_value = hex(hex_num).replace('0x','')
        extracted_hex += hex_value
        count += 1
    logging.info('Supposed dones: %d.' % supposed_dones)
    return extracted_hex


def main():
  LEN = 10000
  block_size = 1

  # generate random bytes.
  s = randstr(LEN)

  # generate random b64, hex.
  b64s = base64.b64encode(s)

  # TODO(tierney): ECC.

  hexs = binascii.hexlify(b64s)

  # encode image.
  codec = JpegEncryptionCodec(block_size)
  image = codec.encode(hexs)

  # save image.
  image.save('test.jpg', quality=95)

  # read image.
  read_im = Image.open('test.jpg')

  # decode image.
  extracted_hexs = codec.decode(read_im)
  errors = 0
  # print hexs
  # print
  # print extracted_hexs
  for i, hex_val in enumerate(hexs):
    if hex_val != extracted_hexs[i]:
      errors += 1
  print 'Errors:', errors, len(hexs)

  # unhex, unb64...
  extracted_b64s = binascii.unhexlify(extracted_hexs)

  # TODO(tierney): un-ECC.

  extracted_s = base64.b64decode(extracted_b64s)

  # compare bytes.

if __name__ == '__main__':
  main()
