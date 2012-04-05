#!/usr/bin/env python

from Crypto.Cipher import AES
from PIL import Image
from tempfile import NamedTemporaryFile
import PIL
import base64
import binascii
import gflags
import logging
import math
import os
import sys
import threading

FLAGS = gflags.FLAGS
gflags.DEFINE_multistring('image', None, 'image to encode and encrypt',
                          short_name = 'i')

class Cipher(object):
  # the block size for the cipher object; must be 16, 24, or 32 for AES
  BLOCK_SIZE = 32

  # the character used for padding--with a block cipher such as AES, the value
  # you encrypt must be a multiple of BLOCK_SIZE in length.  This character is
  # used to ensure that your value is always a multiple of BLOCK_SIZE
  PADDING = '{'

  def __init__(self, password):
    secret = self._pad(password)
    self.cipher = AES.new(secret)

  def _pad(self, s):
    return s + (self.BLOCK_SIZE - len(s) % self.BLOCK_SIZE) * self.PADDING

  def encode(self, message):
    return base64.b64encode(self.cipher.encrypt(self._pad(message)))

  def decode(self, encoded):
    return self.cipher.decrypt(base64.b64decode(encoded)).rstrip(self.PADDING)


class SeeMeNotImage(threading.Thread):
  image = None

  def __init__(self, image_path, width=None, height=None, quality=None):
    self.image_path = image_path
    self.width = width
    self.height = height
    self.quality = quality
    threading.Thread.__init__(self)

  def rescale(self, width, height):
    self.image = self.image.resize((width, height))

  def requality(self, quality):
    with NamedTemporaryFile() as fh:
      image_name = fh.name + '.jpg'
      self.image.save(image_name, quality=quality)
      self.image = Image.open(image_name)

  def encode(self):
    return base64.b64encode(self.image.tostring())

  def encrypt(self):
    pass

  def run(self):
    # Open the image.
    self.image = Image.open(self.image_path)

    # Re{scale,quality} image.
    self.rescale(self.width, self.height)
    self.requality(self.quality)

    b64_image = self.encode()

    c = Cipher('password')
    b64encoded = c.encode(b64_image)

    hex_data = binascii.hexlify(base64.b64decode(b64encoded))

    width = self.width

    colors = ['#FFFFFF',  '#FF0000', '#00FF00', '#0000FF'];
    for i in hex_data:
      hex_val = int(i, 16)
      base4_1 = math.floor(hex_val / 4.0)
      base4_0 = hex_val - (base4_1 * 4)
      y_coord = math.floor(i / width)
      x_coord = i - (y_coord * width)


def main(argv):
  try:
    argv = FLAGS(argv)  # parse flags
  except gflags.FlagsError, e:
    print '%s\\nUsage: %s ARGS\\n%s' % (e, sys.argv[0], FLAGS)
    sys.exit(1)

  c = Cipher('this is my password')
  encoded = c.encode('this is my secret message')
  print encoded

  c1 = Cipher('this is my password')
  decoded = c1.decode(encoded)
  print decoded

  smni = SeeMeNotImage('kenya.jpg', 100, 100, 100)
  smni.start()

if __name__ == '__main__':
  main(sys.argv)
