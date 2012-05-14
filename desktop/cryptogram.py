#!/usr/bin/env python

# TODO(tierney): Last row repair. Instead of writing black, we probably want to
# write an average of the preceeding rows in the block of 8 (due to the JPEG
# DCT). Of course, we must find a way to reengineer this application. Notably,
# the last row will be unrecoverable especially if resizing is involved.

from Cipher.PyV8Cipher import V8Cipher as Cipher
from Codec import Codec
from Encryptor import Encrypt
from ImageCoder import Base64MessageSymbolCoder, Base64SymbolSignalCoder
from PIL import Image
from SymbolShape import four_square, three_square, two_square, one_square, two_by_four, two_by_three, two_by_one
from json import JSONEncoder
from util import sha256hash
import Orientation
import argparse
import base64
import cStringIO
import logging
import sys
import time

logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                    format='%(asctime)-15s %(levelname)8s %(module)10s '\
                      '%(threadName)10s %(thread)16d %(lineno)4d %(message)s')

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

  # Parse arguments from the user.
  parser = argparse.ArgumentParser(
    prog='cryptogram', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
  parser.add_argument('-q', '--quality', type=int, default=95,
                      help='Quality to save encrypted image in range (0,95].')
  parser.add_argument('-p', '--password', type=str, default=None, required=True,
                      help='Password to encrypt image with.')
  parser.add_argument('-s', '--symbol_shape', type=str, default='two_square',
                      help='SymbolShape to use.')
  parser.add_argument('-i', '--image', type=str, default=None,
                      help='Path to input image.')
  parser.add_argument('-e', '--encrypt', type=str, default=None,
                      help='Encrypted image output filename.')
  parser.add_argument('-d', '--decrypt', type=str, default=None,
                      help='Decrypted image output filename.')
  FLAGS = parser.parse_args()


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
    image_buffer = cStringIO.StringIO()
    with open(FLAGS.image, 'rb') as fh:
      image_buffer.write(fh.read())
      length = fh.tell()
      logging.info('%s has size %d.' % (FLAGS.image, length))

    # Reorient the image, if necessary as determined by auto_orient.
    reoriented_image_buffer = cStringIO.StringIO()
    orient = Orientation.Orientation(FLAGS.image)
    if orient.auto_orient(reoriented_image_buffer):
      logging.info('Reoriented the image so reassigning the image_buffer.')
      del image_buffer
      image_buffer = reoriented_image_buffer

    crypto = Encrypt(image_buffer, codec, cipher)
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

if __name__ == '__main__':
  main(sys.argv)
