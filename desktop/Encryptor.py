#!/usr/bin/env python

import base64
import sys
import logging
import os
from tempfile import NamedTemporaryFile
from json import JSONEncoder
from PIL import Image
from util import sha256hash

class Encrypt(object):
  def __init__(self, image_path, codec, cipher):
    self.image_path = image_path
    self.codec = codec
    self.cipher = cipher

  def _image_path_to_encrypted_data(self, image_path):
    logging.info('Reading raw image data.')
    with open(image_path, 'rb') as fh:
      raw_image_file_data = fh.read()
    base64_image_file_data = base64.b64encode(raw_image_file_data)

    logging.info('Cipher encoding data.')
    encrypted_data = self.cipher.encode(base64_image_file_data)

    # Compute integrity check on the encrypted data, which should be base64
    # (in the case of V8Cipher, this includes the jsonified data).
    if self.cipher.__class__.__name__ == 'V8Cipher':
      _to_hash = \
          encrypted_data['iv'] + \
          encrypted_data['salt'] + \
          encrypted_data['ct']
      logging.info('Integrity hash input: %s.' % _to_hash[:32])
      integrity_check_value = sha256hash(_to_hash)
      logging.info('Integrity hash value: %s.' % integrity_check_value)
    else:
      integrity_check_value = sha256hash(encrypted_data)

    # For V8Cipher, we have to tease apart the JSON in order to set the
    # encrypted_data string correctly.
    if self.cipher.__class__.__name__ == 'V8Cipher':
      encrypted_data = \
          integrity_check_value + \
          encrypted_data['iv'] + \
          encrypted_data['salt'] + \
          encrypted_data['ct']

    logging.info('Returning encrypted data.')
    return encrypted_data

  def _reduce_image_quality(self, image_path):
    im = Image.open(image_path)
    with NamedTemporaryFile() as fh:
      new_image_path = fh.name + '.jpg'
      try:
        im.save(new_image_path, quality=77)
      except IOError, e:
        logging.error(str(e))
        raise
    return new_image_path

  def _reduce_image_size(self, image_path, scale):
    im = Image.open(image_path)
    width, height = im.size
    with NamedTemporaryFile() as fh:
      new_image_path = fh.name + '.jpg'
      im = im.resize((int(width * scale), int(height * scale)))
      width, height = im.size

      # Update codec with the new width, height ratio.
      # TODO(tierney): Test if this is necessary.
      # self.codec.set_wh_ratio(width / float(height))

      im.save(new_image_path, quality=77)
    return new_image_path

  def upload_encrypt(self, dimension_limit = 2048):
    _image_path = self.image_path
    requality_limit = 1
    requality_count = 0
    rescale_count = 0
    logging.info('Encrypting image: %s.' % _image_path)

    prospective_image_dimensions = self.codec.get_prospective_image_dimensions
    while True:
      _ = Image.open(_image_path)
      _w, _h = _.size
      logging.info('Cleartext image dimensions: (%d, %d).' % (_w, _h))
      encrypted_data = self._image_path_to_encrypted_data(_image_path)
      width, height = prospective_image_dimensions(encrypted_data)
      if width <= dimension_limit and height <= dimension_limit:
        break

      logging.info('Dimensions too large (w: %d, h: %d).' % (width, height))

      # Strategies to reduce raw bytes that we need to encrypt: requality,
      # rescale.
      if requality_count < requality_limit:
        logging.info('Requality image.')
        _image_path = self._reduce_image_quality(_image_path)
        requality_count += 1
      else:
        rescale_count += 1
        logging.info('Rescale with original image.')
        _image_path = self._reduce_image_size(self.image_path,
                                              1.0-(0.05 * rescale_count))
    return encrypted_data

  def encrypt(self):
    image = Image.open(self.image_path)
    with open(self.image_path, 'rb') as fh:
      raw_image_file_data = fh.read()
    base64_image_file_data = base64.b64encode(raw_image_file_data)
    encrypted_data = cipher.encode(base64_image_file_data)
    width, length = self.codec.get_prospective_image_dimensions()
