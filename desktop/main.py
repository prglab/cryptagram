#!/usr/bin/env python

# TODO(tierney): Last row repair. Instead of writing black, we probably want to
# write an average of the preceeding rows in the block of 8 (due to the JPEG
# DCT). Of course, we must find a way to reengineer this application. Notably,
# the last row will be unrecoverable especially if resizing is involved.

import numpy
import random
import sys
import logging
from SymbolShape import SymbolShape
from Codec import Codec
from PIL import Image
from ImageCoder import Base64MessageSymbolCoder, Base64SymbolSignalCoder
import gflags

logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                    format = '%(asctime)-15s %(levelname)8s %(module)s '\
                      '%(threadName)10s %(thread)16d %(lineno)4d %(message)s')

FLAGS = gflags.FLAGS
gflags.DEFINE_float('hw_ratio', 1.33, 'height/width ratio', short_name = 'r')
gflags.DEFINE_integer('quality', 95,
                      'quality to save encrypted image in range (0,95]. '\
                        '100 disables quantization',
                      short_name = 'q')
gflags.DEFINE_integer('data_length', 16, 'data size to use', short_name = 'l')

gflags.DEFINE_integer('ecc_n', 128, 'codeword length', short_name = 'n')
gflags.DEFINE_integer('ecc_k', 64, 'message byte length', short_name = 'k')

def randb64s(n):
  values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  return [values[i] for i in map(random.randrange,[0]*n,[63]*n)]

def main(argv):
  try:
    argv = FLAGS(argv)  # parse flags
  except gflags.FlagsError, e:
    print '%s\nUsage: %s ARGS\n%s' % (e, sys.argv[0], FLAGS)
    sys.exit(1)

  ss = SymbolShape([[1, 1, 1, 2, 2, 2],
                    [1, 1, 1, 2, 2, 2]])
  codec = Codec(ss, FLAGS.hw_ratio, Base64MessageSymbolCoder(),
                Base64SymbolSignalCoder())

  length = FLAGS.data_length
  quality = FLAGS.quality

  data = randb64s(length)
  im = codec.encode(data)
  im.save('test.jpg',quality=quality)
  with open('test.jpg') as fh:
    fh.read()
    logging.info('Encrypted image size: %d bytes.' % fh.tell())
    logging.info('Encrypted image data expansion %.2f.' % (fh.tell() / float(length)))

  read_back_image = Image.open('test.jpg')
  extracted_data = codec.decode(read_back_image)
  errors = 0
  for i, datum in enumerate(data[:min(len(data), len(extracted_data))]):
    if datum != extracted_data[i]:
      errors += 1
  if len(extracted_data) > len(data):
    errors += len(extracted_data) - len(data)
  print 'Errors:', errors
  #print LD(''.join(data), extracted_data)


if __name__=='__main__':
  main(sys.argv)
