#!/usr/bin/env python

from ECCoder import ECCoder
from PIL import Image,ImageDraw
import base64
import binascii
import gflags
import itertools
import logging
import math
import random
import sys

logging.basicConfig(stream=sys.stdout,
                    level=logging.INFO,
                    format = '%(asctime)-15s %(levelname)8s %(module)s '\
                      '%(threadName)10s %(thread)16d %(lineno)4d %(message)s')

FLAGS = gflags.FLAGS
gflags.DEFINE_integer('encrypted_image_quality', 95,
                      'quality to save encrypted image in range (0,95]. '\
                        '100 disables quantization',
                      short_name = 'e')

gflags.DEFINE_integer('block_size', 2, 'block size to use', short_name = 'b')
gflags.DEFINE_integer('block_width', 2, 'block width', short_name = 'w')
gflags.DEFINE_integer('block_height', 2, 'block height', short_name = 'h')

gflags.DEFINE_integer('data_size', 1000, 'data size to use', short_name = 'd')
# gflags.DEFINE_boolean('ecc', False, 'Use ECC encoding.')
gflags.DEFINE_integer('ecc_n', 128, 'codeword length', short_name = 'n')
gflags.DEFINE_integer('ecc_k', 64, 'message byte length', short_name = 'k')

def randstr(n):
  return ''.join(map(chr, map(random.randrange, [0]*n, [127]*n)))

def square_dimensions(n):
  pass

base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

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
    green = luminance - 0.34414 * (chroma_blue - 128) - 0.71414 * \
        (chroma_red - 128)
    blue = luminance + 1.772 * (chroma_blue - 128)
    return tuple(map(int, (red, green, blue)))

# for color in YCbCr:
#   print color, color_space_transform(YCbCr.get(color), False)

class JpegEncryptionCodec(object):
  _EIGHT_THRESHOLDS = { # Well, nine (we add one for "black").
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
  _INV_EIGHT_THRESHOLDS = dict((v,k) for k, v
                               in _EIGHT_THRESHOLDS.iteritems())
  _THRESHOLDS = {
    '0': 235,
    '1': 185,
    '2': 135,
    '3': 85,
    '4': 35,
    }
  _INV_THRESHOLDS = dict((v,k) for k, v in _THRESHOLDS.iteritems())

  def __init__(self, block_size, block_width, block_height):
    self.block_size = block_size
    self.block_width = block_width
    self.block_height = block_height

  def encode_base64(self, b64_data):
    b64_data.replace('=','')

    NUM_BLOCKS = 2
    SIZE_OF_BLOCKS = self.block_width * self.block_height # assume rectangle for now.
    expanded_data_length = len(b64_data) * NUM_BLOCKS * SIZE_OF_BLOCKS

    _width = 1.3
    _height = 1.

    MULTIPLIER = _width * _height
    _ratio = int(math.ceil((expanded_data_length / (1. * MULTIPLIER)) ** .5))
    new_image_width = int(_width * _ratio) if int(_width * _ratio) == 0 else int(_width * _ratio) - 1
    _new_image_height = int(math.ceil(expanded_data_length / (1. * new_image_width)))
    new_image_height = _new_image_height
    if _new_image_height % 2 != 0:
      new_image_height = _new_image_height + 1

    width = int(new_image_width / (1. * self.block_width * NUM_BLOCKS))
    height = int(math.ceil(expanded_data_length / (1. * width)))

    image = Image.new('RGB', (new_image_width, new_image_height))
    draw = ImageDraw.Draw(image)
    draw.rectangle([0,0,new_image_width+1, new_image_height+1], fill=(0,0,0))

    for i, b64_datum in enumerate(b64_data):
      y_coord = int(i / (1. * width))
      x_coord = int(i - (y_coord * width))

      index = base64chars.find(b64_datum)
      if index < 0:
        logging.info('Non b64 values for (%d, %d).' % (x_coord, y_coord))
        base4_0_x = int(x_coord * self.block_width * 2)
        base4_0_y = int(y_coord * self.block_height)
        base4_0_rectangle = \
            [(base4_0_x, base4_0_y),
             (base4_0_x + self.block_width, base4_0_y + self.block_height)]
        logging.info('Non b64 values rect: %s.' % str(base4_0_rectangle))
        base4_0, base4_1 = '8', '8'
      else:
        octal_val = '%02s' % (oct(index)[1:])
        base4_0, base4_1 = list(octal_val.replace(' ','0'))

      # print  b64_datum, base4_0, base4_1, index
      base4_0_x = int(x_coord * self.block_width * 2)
      base4_0_y = int(y_coord * self.block_height)
      base4_0_rectangle = \
          [(base4_0_x, base4_0_y),
           (base4_0_x + self.block_width, base4_0_y + self.block_height)]
      # logging.info('Inputted base4_0_r: %s.' % str(base4_0_rectangle))
      base4_0_fill = self._EIGHT_THRESHOLDS[base4_0]
      # base4_0_value = color_space_transform(
      #   (base4_0_fill, base4_0_fill, base4_0_fill), False)
      base4_0_value = (base4_0_fill, base4_0_fill, base4_0_fill)
      draw.rectangle(base4_0_rectangle, fill=base4_0_value)

      base4_1_x = int((x_coord * self.block_width * 2) + self.block_width)
      base4_1_y = int(y_coord * self.block_height)
      base4_1_rectangle = \
        [(base4_1_x, base4_1_y),
         (base4_1_x + self.block_width, base4_1_y + self.block_height)]
      # logging.info('Inputted base4_1_r: %s.' % str(base4_1_rectangle))
      base4_1_fill = self._EIGHT_THRESHOLDS[base4_1]
      # base4_1_value = color_space_transform(
      #   (base4_1_fill, base4_1_fill, base4_1_fill), False)
      base4_1_value = (base4_1_fill, base4_1_fill, base4_1_fill)
      #print base4_1_rectangle, base4_1_value
      draw.rectangle(base4_1_rectangle, fill=base4_1_value)

      # logging.info(
      #   'Inputted [%s], (%2d, %2d) octal_val base4_0 base4_1 %2s %2s %2s FILL %d %d.' % \
      #     (b64_datum, x_coord, y_coord, octal_val, base4_0, base4_1, base4_0_fill, base4_1_fill))

    image.load()
    return image

  def _decode_eight_block(self, block):
    block_data = list(block.getdata())
    # print block_data
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

    keys = sorted(self._INV_EIGHT_THRESHOLDS.keys())
    ret = int(self._INV_EIGHT_THRESHOLDS.get(keys[bsearch(keys, lum)]))
    # logging.info('Decoded %.2f %s %d ' % (lum, str(keys), ret))
    return ret


  def _base64_pad(self, s):
    mod = len(s) % 4
    if mod == 0:
      return s
    return s + (4 - mod) * '='

  def decode_base64(self, rgb_image):
    width, height = rgb_image.size
    image = rgb_image.convert('RGB')
    extracted_b64 = ''
    count = 0
    supposed_dones = 0
    NUM_BLOCKS = 2
    for y in range(0, height, self.block_height):
      for x in range(0, width, self.block_width * NUM_BLOCKS):
        block0_rect = (x, y, x + self.block_width, y + self.block_height)
        # logging.info('block0_rect %s.' % str(block0_rect))
        block0 = image.crop(block0_rect)
        block1_rect = (x + self.block_width, y,
                       x + (2 * self.block_width), y + self.block_height)
        # logging.info('block1_rect %s.' % str(block1_rect))
        block1 = image.crop(block1_rect)

        base4_0 = self._decode_eight_block(block0)
        base4_1 = self._decode_eight_block(block1)

        # Value that represents zero.
        if (base4_0 == 8 or base4_1 == 8):
          supposed_dones += 1
          logging.info('Supposedly done at (%d, %d) but given (%d, %d).' % \
                         (x, y, width, height))
          # print height-1, [y, y + self.block_height]
          if (height in range(y, y + self.block_height + 1)):
            logging.info('Actually done at (%d, %d).' % (x, y))
            break
          else:
            if base4_0 == 8: base4_0 -= 1
            if base4_1 == 8: base4_1 -= 1

        index = int('%d%d' % (base4_0, base4_1), 8)
        # logging.info(
        #   'Extracted (%2d, %2d) base4_0 base4_1 %2d %2d (%s)' % \
        #     (x, y, base4_0, base4_1, base64chars[index]))

        extracted_b64 += base64chars[index]

    extracted_b64 = self._base64_pad(extracted_b64)
    return extracted_b64

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

      # BEGIN Converting hex value to two four-quantized blocks.
      hex_val = int(hex_datum, 16)
      base4_1 = int(hex_val / 4.0)
      base4_0 = int(hex_val - (base4_1 * 4))

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
    # logging.debug('Decoded %.2f %s %d ' % (lum, str(keys), ret))
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
          logging.info('Supposedly done at (%d, %d).' % (x, y))
          if (x == width or y == height):
            logging.info('Actually done at (%d, %d).' % (x, y))
            break

        hex_num = (base4_0 + base4_1 * 4) % 16

        hex_value = hex(hex_num).replace('0x','')
        extracted_hex += hex_value
        count += 1
    # logging.info('Supposed dones: %d.' % supposed_dones)
    return extracted_hex

def main(argv):
  try:
    argv = FLAGS(argv)  # parse flags
  except gflags.FlagsError, e:
    print '%s\nUsage: %s ARGS\n%s' % (e, sys.argv[0], FLAGS)
    sys.exit(1)

  # generate random bytes.
  s = randstr(FLAGS.data_size)
  # s = 'a' * FLAGS.data_size
  logging.info('Data size (orig): %d.' % FLAGS.data_size)

  coder = ECCoder(FLAGS.ecc_n, FLAGS.ecc_k)
  ecc = coder.encode(s)
  ecc64s = base64.b64encode(ecc)
  logging.info('Data size (eccs): %d.' % len(ecc64s))

  # # encode image.
  codec = JpegEncryptionCodec(
    FLAGS.block_size, FLAGS.block_width, FLAGS.block_height)

  image = codec.encode_base64(ecc64s)
  image.save('test_b64.jpg', quality=FLAGS.encrypted_image_quality)

  read_im = Image.open('test_b64.jpg')
  extracted_eccb64s = codec.decode_base64(read_im)
  ecc = base64.b64decode(extracted_eccb64s)
  ext_s = coder.decode(ecc)
  with open('string_org.dat','w') as fh:
    b64_org = base64.b64encode(s)
    for i in range(0, len(b64_org), 80):
      fh.write(b64_org[i:i+80] + '\n')
  with open('string_ext.dat','w') as fh:
    b64_ext = base64.b64encode(ext_s)
    for i in range(0, len(b64_ext), 80):
      fh.write(b64_ext[i:i+80] + '\n')

  print len(s)
  print len(ext_s)
  errors = 0
  for i, val in enumerate(ext_s):
    if i >= len(s) - 1:
      errors += (len(ext_s) - len(s))
      break
    if val != s[i]:
      errors += 1
  print 'Errors', errors
  # print len(b64s)

  # extracted_bin = coder.decode(extracted_b64s)
  # print codec.decode_base64(read_im)

  return
  image = codec.encode(hexs)

  # save image.
  image.save('test.jpg', quality=FLAGS.encrypted_image_quality)

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
  logging.info('Errors: %d %d (%.2f)' % (errors, len(hexs), errors / (1. * len(hexs))))

  # unhex, unb64...
  try:
    extracted_b64s = binascii.unhexlify(extracted_hexs)
  except ValueError:
    logging.error('Failed to unhexlify.')

  extracted_bin = coder.decode(extracted_b64s)

  # TODO(tierney): un-ECC.
  result = (b64s == extracted_bin)
  print result
  logging.info('ecc_n:%d,ecc_k:%d,quality:%d,block:%d,result:%d' % \
                 (FLAGS.ecc_n, FLAGS.ecc_k,
                  FLAGS.encrypted_image_quality,
                  FLAGS.block_size, result))

  try:
    extracted_s = base64.b64decode(extracted_bin)
  except TypeError, e:
    logging.error('Failed to b64decode.')

  # compare bytes.

if __name__ == '__main__':
  main(sys.argv)
