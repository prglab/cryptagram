#!/usr/bin/env python

# TODO(tierney): Last row repair. Instead of writing black, we probably want to
# write an average of the preceeding rows in the block of 8 (due to the JPEG
# DCT). Of course, we must find a way to reengineer this application. Notably,
# the last row will be unrecoverable especially if resizing is involved.

import base64
import sys
import logging
import os
from tempfile import NamedTemporaryFile
from Cipher.PyV8Cipher import V8Cipher as Cipher
from json import JSONEncoder, JSONDecoder
from util import sha256hash
import time

from Encryptor import Encrypt
from SymbolShape import SymbolShape, four_square, three_square, two_square, \
    one_square, two_by_four, two_by_three, two_by_one
from Codec import Codec
from PIL import Image
from ImageCoder import Base64MessageSymbolCoder, Base64SymbolSignalCoder
import gflags

logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                    format = '%(asctime)-15s %(levelname)8s %(module)10s '\
                      '%(threadName)10s %(thread)16d %(lineno)4d %(message)s')

FLAGS = gflags.FLAGS
gflags.DEFINE_integer('quality', 95,
                      'quality to save encrypted image in range (0,95]. ',
                      short_name = 'q')
gflags.DEFINE_string('password', None, 'Password to encrypt image with.',
                     short_name = 'p')
gflags.DEFINE_string('symbol_shape', 'two_square', 'symbol shape to use',
                     short_name ='s')
gflags.DEFINE_string('image', None, 'path to input image', short_name = 'i')
gflags.DEFINE_string('encrypt', None, 'encrypted image output filename',
                     short_name = 'e')
gflags.DEFINE_string('decrypt', None, 'decrypted image output filename',
                      short_name = 'd')

gflags.MarkFlagAsRequired('password')

_AVAILABLE_SHAPES = {
  'four_square' : four_square,
  'three_square': three_square,
  'two_square' : two_square,
  'one_square' : one_square,
  'two_by_four' : two_by_four,
  'two_by_three' : two_by_three,
  'two_by_one' : two_by_one,
}

def main(argv):
  try:
    argv = FLAGS(argv)  # parse flags
  except gflags.FlagsError, e:
    print '%s\nUsage: %s ARGS\n%s' % (e, sys.argv[0], FLAGS)
    sys.exit(1)

  symbol_shape = _AVAILABLE_SHAPES[FLAGS.symbol_shape]
  quality = FLAGS.quality
  cipher = Cipher(FLAGS.password, command_line=True)

  if FLAGS.image and FLAGS.encrypt:
    logging.info('Image to encrypt: %s.' % FLAGS.image)

    # Update codec based on wh_ratio from given image.
    _image = Image.open(FLAGS.image)
    _width, _height = _image.size
    wh_ratio = _width / float(_height)
    codec = Codec(symbol_shape, wh_ratio, Base64MessageSymbolCoder(),
                  Base64SymbolSignalCoder())

    # Determine file size.
    with open(FLAGS.image,'rb') as fh:
      orig_data = fh.read()
      length = fh.tell()
      logging.info('Image filesize: %d bytes.' % length)

    crypto = Encrypt(FLAGS.image, codec, cipher)
    encrypted_data = crypto.upload_encrypt()
    logging.info('Encrypted data length: %d.' % len(encrypted_data))

    codec.set_direction('encode')
    codec.set_data(encrypted_data)
    codec.start()
    while True:
      im = codec.get_result()
      if im: break
      logging.info('Progress: %.2f%%.' % \
                     (100. * codec.get_percent_complete()))
      time.sleep(0.5)

    logging.info('Saving encrypted jpeg with quality %d.' % quality)
    with open(FLAGS.encrypt, 'w') as out_file:
      im.save(out_file, quality=quality)

    with open(FLAGS.encrypt) as fh:
      fh.read()
      logging.info('Encrypted image size: %d bytes.' % fh.tell())
      logging.info('Encrypted image data expansion %.2f.' % \
                     (fh.tell() / float(length)))
    del codec

  if not FLAGS.decrypt:
    return

  if FLAGS.image and FLAGS.encrypt and FLAGS.decrypt:
    read_back_image = Image.open(FLAGS.encrypt)
  elif FLAGS.image and not FLAGS.encrypt and FLAGS.decrypt:
    logging.info('Reading message we did not encrypt.')
    with open(FLAGS.image, 'rb') as fh:
      fh.read()
      logging.info('Encrypted image filesize: %d.' % fh.tell())

    read_back_image = Image.open(FLAGS.image)
    _width, _height = read_back_image.size
    wh_ratio = _width / float(_height)

  codec = Codec(symbol_shape, wh_ratio, Base64MessageSymbolCoder(),
                Base64SymbolSignalCoder())

  codec.set_direction('decode')
  codec.set_data(read_back_image)
  codec.start()
  while True:
    binary_decoding = codec.get_result()
    if binary_decoding: break
    logging.info('Progress: %.2f%%.' % \
                   (100. * codec.get_percent_complete()))
    time.sleep(0.5)

  if FLAGS.encrypt and FLAGS.decrypt:
    logging.info('Byte for byte diff: %d.' % \
                   byte_for_byte_compare(encrypted_data, binary_decoding))

  # Required "un"-filtering to base64 data.
  def _base64_pad(s):
    mod = len(s) % 4
    if mod == 0: return s
    return s + (4 - mod) * '='

  # padded_decoding = _base64_pad(binary_decoding)
  _integrity_check = binary_decoding[0:64]
  _to_check = binary_decoding[64:]
  logging.info('Input to integrity check: %s.' % _to_check[:32])
  integrity_check_value = sha256hash(_to_check)
  logging.info('Extracted integrity check: %s.' % _integrity_check)
  logging.info('Calculated integrity check: %s.' % integrity_check_value)

  _iv = binary_decoding[64:86]
  _salt = binary_decoding[86:97]
  _ct = binary_decoding[97:]

  decoded = {'iv':_iv, 'salt':_salt, 'ct':_ct}
  json_str = JSONEncoder().encode(decoded)

  if _integrity_check != integrity_check_value:
    logging.warning('Integrity check mismatch')
  else:
    logging.info('Integrity check passed.')

  decrypted_decoded = cipher.decode(json_str)
  extracted_data = base64.b64decode(decrypted_decoded)

  if FLAGS.image and FLAGS.decrypt:
    with open(FLAGS.decrypt, 'wb') as fh:
      fh.write(extracted_data)
    logging.info('Saved decrypted file: %s.' % FLAGS.decrypt)


def byte_for_byte_compare(a, b):
  errors = 0
  for i, datum in enumerate(a[:min(len(a), len(b))]):
    if datum != b[i]:
      errors += 1
  if len(b) > len(a):
    errors += len(b) - len(a)
  return errors

if __name__=='__main__':
  main(sys.argv)
