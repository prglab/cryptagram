#!/usr/bin/env python

# TODO(tierney): Last row repair. Instead of writing black, we probably want to
# write an average of the preceeding rows in the block of 8 (due to the JPEG
# DCT). Of course, we must find a way to reengineer this application. Notably,
# the last row will be unrecoverable especially if resizing is involved.

import base64
import numpy
import random
import sys
import logging
from Cipher import Cipher
from SymbolShape import SymbolShape
from Codec import Codec
from PIL import Image
from ImageCoder import Base64MessageSymbolCoder, Base64SymbolSignalCoder
import gflags

logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                    format = '%(asctime)-15s %(levelname)8s %(module)10s '\
                      '%(threadName)10s %(thread)16d %(lineno)4d %(message)s')

FLAGS = gflags.FLAGS
gflags.DEFINE_float('wh_ratio', 1.33, 'height/width ratio', short_name = 'r')
gflags.DEFINE_integer('quality', 95,
                      'quality to save encrypted image in range (0,95]. '\
                        '100 disables quantization',
                      short_name = 'q')
gflags.DEFINE_integer('data_length', 16, 'data size to use', short_name = 'l')
gflags.DEFINE_integer('ecc_n', 128, 'codeword length', short_name = 'n')
gflags.DEFINE_integer('ecc_k', 64, 'message byte length', short_name = 'k')
gflags.DEFINE_string('password', None, 'Password to encrypt image with.',
                     short_name = 'p')
gflags.DEFINE_string('image', None, 'path to input image', short_name = 'i')

gflags.MarkFlagAsRequired('password')

def randstr(n):
  return ''.join(map(chr, map(random.randrange, [0]*n, [127]*n)))
def randb64s(n):
  values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  return ''.join([values[i] for i in map(random.randrange,[0]*n,[63]*n)])

def main(argv):
  try:
    argv = FLAGS(argv)  # parse flags
  except gflags.FlagsError, e:
    print '%s\nUsage: %s ARGS\n%s' % (e, sys.argv[0], FLAGS)
    sys.exit(1)

  ss = SymbolShape([[1, 1, 1, 1, 2, 2, 2, 2],
                    [1, 1, 1, 1, 2, 2, 2, 2]])
  wh_ratio = FLAGS.wh_ratio
  length = FLAGS.data_length
  quality = FLAGS.quality

  cipher = Cipher(FLAGS.password)

  # Get data.
  orig_data = randstr(int(length * .75))

  if FLAGS.image:
    _image = Image.open(FLAGS.image)
    _width, _height = _image.size
    wh_ratio = _width / float(_height)
    with open(FLAGS.image,'rb') as fh:
      orig_data = fh.read()
      length = fh.tell()
      logging.info('Image filesize: %d bytes.' % length)
  b64data = base64.b64encode(orig_data)


  codec = Codec(ss, wh_ratio, Base64MessageSymbolCoder(),
                Base64SymbolSignalCoder())

  data = cipher.encode(b64data)

  # Required filtering on base64 data.
  data = data.replace('=','')

  im = codec.encode(data)

  logging.info('Saving encrypted jpeg with quality %d.' % quality)
  im.save('test.jpg',quality=quality)
  with open('test.jpg') as fh:
    fh.read()
    logging.info('Encrypted image size: %d bytes.' % fh.tell())
    logging.info('Encrypted image data expansion %.2f.' % (fh.tell() / float(length)))

  read_back_image = Image.open('test.jpg')
  binary_decoding = codec.decode(read_back_image)

  # Required "un"-filtering to base64 data.
  def _base64_pad(s):
    mod = len(s) % 4
    if mod == 0: return s
    return s + (4 - mod) * '='
  padded_decoding = _base64_pad(binary_decoding)

  decrypted_decoded = cipher.decode(padded_decoding)
  extracted_data = base64.b64decode(decrypted_decoded)
  if FLAGS.image:
    with open('decoded.jpg', 'wb') as fh:
      fh.write(extracted_data)
  print orig_data == extracted_data

  errors = 0
  for i, datum in enumerate(orig_data[:min(len(orig_data), len(extracted_data))]):
    if datum != extracted_data[i]:
      errors += 1
  if len(extracted_data) > len(orig_data):
    errors += len(extracted_data) - len(orig_data)
  print 'Errors:', errors

if __name__=='__main__':
  main(sys.argv)
