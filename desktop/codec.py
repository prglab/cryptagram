#!/usr/bin/env python

from PIL import Image,ImageDraw
import math
import random
import binascii
import base64

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
  if hi is None:
    hi = len(a)

  if x < a[lo]: return lo
  if x > a[hi-1]: return hi

  while lo < hi:
    mid = (lo+hi)/2
    midval = a[mid]
    if midval < x:
      lo = mid+1
    elif midval > x:
      hi = mid
    else:
      return mid
  if lo == hi:
    return hi
  return -1


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
    '0' : 16,
    '1' : 31,
    '2' : 46,
    '3' : 61,
    '4' : 76,
    '5' : 91,
    '6' : 106,
    '7' : 121,
    '8' : 136,
    '9' : 151,
    'a' : 166,
    'b' : 181,
    'c' : 196,
    'd' : 211,
    'e' : 226,
    'f' : 235,
    }

  _INV_THRESHOLDS = dict((v,k) for k, v in _THRESHOLDS.iteritems())

  def __init__(self):
    pass

  def _threshold_map(self, index):
    # (Y,Cb,Cr) -> hex.
    # Currently: 2**3 * 2

    pass

  def encode(self, hex_data, image):
    width, height = image.size
    for i, hex_datum in enumerate(hex_data):
      y_coord = int(i / (1. * width))
      x_coord = int(i - (y_coord * width))

      fill = self._THRESHOLDS[hex_datum]
      value = color_space_transform((fill, fill, fill))
      image.putpixel((x_coord, y_coord), value)

  def decode(self, rgb_image):
    # Returns the hex_data.
    width, height = rgb_image.size
    image = rgb_image.convert('YCbCr')
    extracted_hex = ''
    for y in range(height):
      for x in range(width):
        lum, cb, cr = image.getpixel((x,y))
        keys = sorted(self._INV_THRESHOLDS.keys())
        m = bsearch(keys, lum)
        hex_val = hex(m).replace('0x','')
        extracted_hex += hex_val

    return extracted_hex


def main():
  LEN = 100
  # generate random bytes.
  s = randstr(LEN)

  # generate random b64, hex.
  b64s = base64.b64encode(s)
  hexs = binascii.hexlify(b64s)

  height = int(math.ceil(math.sqrt(len(hexs))))
  width = int(math.ceil(len(hexs) / (1. * height)))
  print len(hexs), height, width

  # encode image.
  image = Image.new('YCbCr', (width, height))

  codec = JpegEncryptionCodec()
  codec.encode(hexs, image)

  # save image.
  image.save('test.jpg', quality=95)

  # read image.
  read_im = Image.open('test.jpg')

  # decode image.
  extracted_hexs = codec.decode(read_im)
  errors = 0
  for i, hex_val in enumerate(hexs):
    if hex_val != extracted_hexs[i]:
      errors += 1
  print 'Errors:', errors, len(hexs)

  # unhex, unb64...
  extracted_b64s = binascii.unhexlify(extracted_hexs)
  extracted_s = base64.b64decode(extracted_b64s)

  # compare bytes.

if __name__ == '__main__':
  main()
